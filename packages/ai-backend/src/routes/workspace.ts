/**
 * @fileoverview Workspace Routes
 * @description Workspace profile and member-management endpoints for the signed-in account.
 */

import { eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { db } from '../db/index.js';
import { meetings } from '../db/schema/meetings.js';
import { organizations, projects, workspaceInvitations } from '../db/schema/organizations.js';
import { users } from '../db/schema/users.js';
import { requireOrganizationId } from '../lib/access.js';

const updateWorkspaceSchema = z
  .object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').max(80).optional(),
    logoUrl: z.string().url('Workspace logo must be a valid URL').nullable().optional(),
  })
  .refine((value) => value.name !== undefined || value.logoUrl !== undefined, {
    message: 'At least one field must be provided',
  });

const createInvitationSchema = z.object({
  email: z.string().email('A valid email address is required'),
  role: z.enum(['admin', 'member']).default('member'),
});

function requireAdmin(request: FastifyRequest, reply: FastifyReply): boolean {
  if (request.user?.role !== 'admin') {
    reply.status(403).send({ error: 'Workspace admin access is required' });
    return false;
  }

  return true;
}

export async function workspaceRoutes(server: FastifyInstance): Promise<void> {
  server.get('/api/v1/workspace', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const [workspace] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (!workspace) {
        return reply.status(404).send({ error: 'Workspace not found' });
      }

      const workspaceMembers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, organizationId));
      const workspaceProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, organizationId));
      const workspaceMeetings = await db
        .select()
        .from(meetings)
        .where(eq(meetings.organizationId, organizationId));
      const workspaceInviteHistory = await db
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.organizationId, organizationId));

      const currentUser =
        workspaceMembers.find((member) => member.id === request.user?.userId) ?? null;
      const memberLookup = new Map(
        workspaceMembers.map((member) => [
          member.id,
          {
            displayName: member.displayName,
            email: member.email,
          },
        ])
      );

      const recentActivity = [
        ...workspaceProjects.map((project) => ({
          id: `project-${project.id}`,
          type: 'project_created',
          title: project.name,
          description:
            project.status === 'active'
              ? 'Project created and active'
              : `Project ${project.status}`,
          occurredAt: project.createdAt,
          href: `/projects/${project.id}`,
        })),
        ...workspaceMeetings.map((meeting) => ({
          id: `meeting-${meeting.id}`,
          type: 'meeting_processed',
          title: meeting.title,
          description:
            meeting.totalTranscriptEvents && meeting.totalTranscriptEvents > 0
              ? `${meeting.totalTranscriptEvents} transcript events captured`
              : 'Meeting record created',
          occurredAt: meeting.endTime ?? meeting.startTime ?? meeting.createdAt,
          href: `/meetings/${meeting.id}`,
        })),
        ...workspaceInviteHistory.map((invitation) => ({
          id: `invite-${invitation.id}`,
          type: invitation.acceptedAt ? 'invite_accepted' : 'invite_created',
          title: invitation.email,
          description: invitation.acceptedAt
            ? `Joined the workspace as ${invitation.role}`
            : `Invited as ${invitation.role} by ${
                memberLookup.get(invitation.invitedBy ?? '')?.displayName ??
                memberLookup.get(invitation.invitedBy ?? '')?.email ??
                'a workspace admin'
              }`,
          occurredAt: invitation.acceptedAt ?? invitation.createdAt,
          href: '/workspace',
        })),
      ]
        .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
        .slice(0, 8);

      return reply.send({
        workspace,
        currentUser: currentUser
          ? {
              id: currentUser.id,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: currentUser.role,
              isActive: currentUser.isActive,
              createdAt: currentUser.createdAt,
              lastLoginAt: currentUser.lastLoginAt,
            }
          : null,
        stats: {
          memberCount: workspaceMembers.length,
          adminCount: workspaceMembers.filter((member) => member.role === 'admin').length,
          projectCount: workspaceProjects.length,
          activeProjectCount: workspaceProjects.filter((project) => project.status === 'active')
            .length,
          meetingCount: workspaceMeetings.length,
        },
        recentActivity,
      });
    } catch (error) {
      console.error('Get workspace error:', error);
      return reply.status(500).send({ error: 'Failed to load workspace' });
    }
  });

  server.get('/api/v1/workspace/members', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const workspaceMembers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, organizationId));

      const members = workspaceMembers
        .map((member) => ({
          id: member.id,
          email: member.email,
          displayName: member.displayName,
          role: member.role,
          isActive: member.isActive,
          createdAt: member.createdAt,
          lastLoginAt: member.lastLoginAt,
          isCurrentUser: member.id === request.user?.userId,
        }))
        .sort((left, right) => {
          if (left.role !== right.role) {
            return left.role === 'admin' ? -1 : 1;
          }

          return left.displayName.localeCompare(right.displayName);
        });

      return reply.send({ members });
    } catch (error) {
      console.error('List workspace members error:', error);
      return reply.status(500).send({ error: 'Failed to list workspace members' });
    }
  });

  server.get(
    '/api/v1/workspace/invitations',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;
        if (!requireAdmin(request, reply)) return;

        const workspaceMembers = await db
          .select()
          .from(users)
          .where(eq(users.organizationId, organizationId));

        const memberLookup = new Map(
          workspaceMembers.map((member) => [
            member.id,
            {
              displayName: member.displayName,
              email: member.email,
            },
          ])
        );

        const invitations = await db
          .select()
          .from(workspaceInvitations)
          .where(eq(workspaceInvitations.organizationId, organizationId));

        return reply.send({
          invitations: invitations
            .map((invitation) => ({
              id: invitation.id,
              email: invitation.email,
              role: invitation.role,
              status: invitation.status,
              token: invitation.token,
              invitedBy: invitation.invitedBy,
              invitedByName: invitation.invitedBy
                ? (memberLookup.get(invitation.invitedBy)?.displayName ?? null)
                : null,
              invitedByEmail: invitation.invitedBy
                ? (memberLookup.get(invitation.invitedBy)?.email ?? null)
                : null,
              expiresAt: invitation.expiresAt,
              acceptedAt: invitation.acceptedAt,
              createdAt: invitation.createdAt,
              updatedAt: invitation.updatedAt,
            }))
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
        });
      } catch (error) {
        console.error('List workspace invitations error:', error);
        return reply.status(500).send({ error: 'Failed to list workspace invitations' });
      }
    }
  );

  server.post(
    '/api/v1/workspace/invitations',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;
        if (!requireAdmin(request, reply)) return;

        const body = createInvitationSchema.parse(request.body);
        const normalizedEmail = body.email.trim().toLowerCase();

        const [existingMember] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (existingMember?.organizationId === organizationId) {
          return reply.status(409).send({ error: 'This person is already in the workspace' });
        }

        if (existingMember && existingMember.organizationId !== organizationId) {
          return reply.status(409).send({
            error: 'This email already belongs to another workspace account in the current model',
          });
        }

        const existingInvitations = await db
          .select()
          .from(workspaceInvitations)
          .where(eq(workspaceInvitations.organizationId, organizationId));

        const activeInvitation = existingInvitations.find(
          (invitation) =>
            invitation.email.toLowerCase() === normalizedEmail &&
            invitation.status === 'pending' &&
            invitation.expiresAt > new Date()
        );

        if (activeInvitation) {
          return reply
            .status(409)
            .send({ error: 'A pending invitation already exists for this email' });
        }

        const [invitation] = await db
          .insert(workspaceInvitations)
          .values({
            organizationId,
            email: normalizedEmail,
            role: body.role,
            token: crypto.randomUUID(),
            status: 'pending',
            invitedBy: request.user?.userId ?? null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          })
          .returning();

        return reply.status(201).send({ invitation });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Validation failed', details: error.errors });
        }

        console.error('Create workspace invitation error:', error);
        return reply.status(500).send({ error: 'Failed to create workspace invitation' });
      }
    }
  );

  server.delete(
    '/api/v1/workspace/invitations/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const organizationId = requireOrganizationId(request, reply);
        if (!organizationId) return;
        if (!requireAdmin(request, reply)) return;

        const [invitation] = await db
          .select()
          .from(workspaceInvitations)
          .where(eq(workspaceInvitations.id, request.params.id))
          .limit(1);

        if (!invitation || invitation.organizationId !== organizationId) {
          return reply.status(404).send({ error: 'Invitation not found' });
        }

        await db.delete(workspaceInvitations).where(eq(workspaceInvitations.id, invitation.id));

        return reply.send({ success: true });
      } catch (error) {
        console.error('Delete workspace invitation error:', error);
        return reply.status(500).send({ error: 'Failed to delete workspace invitation' });
      }
    }
  );

  server.patch('/api/v1/workspace', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;
      if (!requireAdmin(request, reply)) return;

      const body = updateWorkspaceSchema.parse(request.body);

      const [updatedWorkspace] = await db
        .update(organizations)
        .set({
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();

      return reply.send({ workspace: updatedWorkspace });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed', details: error.errors });
      }

      console.error('Update workspace error:', error);
      return reply.status(500).send({ error: 'Failed to update workspace' });
    }
  });
}
