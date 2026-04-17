/**
 * @fileoverview Route access helpers
 * @description Shared helpers for enforcing organization-scoped access to
 *   projects and meetings once authentication is enabled.
 */

import { and, eq } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { db } from '../db/index.js';
import { meetingRepository } from '../db/repositories/meeting.repository.js';
import { projects } from '../db/schema/organizations.js';

type AuthorizedMeeting = NonNullable<Awaited<ReturnType<typeof meetingRepository.findById>>>;
type AuthorizedProject = typeof projects.$inferSelect;

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
  projectId: string
): Promise<AuthorizedProject | null> {
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

  return project;
}

export async function requireMeetingAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  meetingId: string
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

  return meeting;
}
