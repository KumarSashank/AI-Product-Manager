/**
 * @fileoverview Route access helpers
 * @description Shared helpers for enforcing organization-scoped access to
 *   projects and meetings once authentication is enabled.
 */

import { and, eq, or } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { db } from '../db/index.js';
import { meetingRepository } from '../db/repositories/meeting.repository.js';
import { projects } from '../db/schema/organizations.js';
import { projectCollaborators } from '../db/schema/projectCollaborators.js';

type AuthorizedMeeting = NonNullable<Awaited<ReturnType<typeof meetingRepository.findById>>>;
type AuthorizedProject = typeof projects.$inferSelect;
export type ProjectPermission = 'owner' | 'editor' | 'viewer';

export interface AuthorizedProjectAccess {
  project: AuthorizedProject;
  permission: ProjectPermission;
}

function permissionRank(permission: ProjectPermission): number {
  switch (permission) {
    case 'owner':
      return 3;
    case 'editor':
      return 2;
    case 'viewer':
      return 1;
    default:
      return 0;
  }
}

function roleToPermission(role: string | null | undefined): ProjectPermission {
  if (role === 'editor') return 'editor';
  return 'viewer';
}

export function requireOrganizationId(request: FastifyRequest, reply: FastifyReply): string | null {
  const organizationId = request.user?.organizationId ?? null;

  if (!organizationId) {
    reply.status(403).send({ error: 'No workspace is associated with this account' });
    return null;
  }

  return organizationId;
}

export async function requireProjectAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  projectId: string,
  minimumPermission: ProjectPermission = 'viewer'
): Promise<AuthorizedProjectAccess | null> {
  const organizationId = requireOrganizationId(request, reply);
  if (!organizationId) return null;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, organizationId)))
    .limit(1);

  if (!project) {
    reply.status(404).send({ error: 'Project not found' });
    return null;
  }

  const userId = request.user?.userId ?? null;
  const userEmail = request.user?.email?.toLowerCase() ?? null;
  let permission: ProjectPermission | null = null;

  if (request.user?.role === 'admin' || (userId && project.createdBy === userId)) {
    permission = 'owner';
  } else {
    const collaboratorQuery = [];
    if (userId) {
      collaboratorQuery.push(eq(projectCollaborators.userId, userId));
    }
    if (userEmail) {
      collaboratorQuery.push(eq(projectCollaborators.email, userEmail));
    }

    if (collaboratorQuery.length > 0) {
      const [collaborator] = await db
        .select()
        .from(projectCollaborators)
        .where(
          and(
            eq(projectCollaborators.projectId, projectId),
            eq(projectCollaborators.status, 'accepted'),
            collaboratorQuery.length === 1 ? collaboratorQuery[0]! : or(...collaboratorQuery)
          )
        )
        .limit(1);

      if (collaborator) {
        permission = roleToPermission(collaborator.role);
      }
    }
  }

  if (!permission) {
    reply.status(404).send({ error: 'Project not found' });
    return null;
  }

  if (permissionRank(permission) < permissionRank(minimumPermission)) {
    reply.status(403).send({ error: 'You do not have permission to modify this project' });
    return null;
  }

  return { project, permission };
}

export async function requireMeetingAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  meetingId: string,
  minimumProjectPermission: ProjectPermission = 'viewer'
): Promise<AuthorizedMeeting | null> {
  const organizationId = requireOrganizationId(request, reply);
  if (!organizationId) return null;

  const meeting = await meetingRepository.findById(meetingId);

  if (!meeting) {
    reply.status(404).send({ error: 'Meeting not found' });
    return null;
  }

  const meetingOrganizationId = meeting.organizationId ?? meeting.project?.organizationId ?? null;

  if (meetingOrganizationId !== organizationId) {
    reply.status(404).send({ error: 'Meeting not found' });
    return null;
  }

  if (meeting.projectId) {
    const projectAccess = await requireProjectAccess(
      request,
      reply,
      meeting.projectId,
      minimumProjectPermission
    );
    if (!projectAccess) return null;
  }

  return meeting;
}
