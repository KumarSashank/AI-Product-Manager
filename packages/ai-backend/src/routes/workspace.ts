/**
 * @fileoverview Workspace Routes
 * @description Workspace profile and member-management endpoints for the signed-in account.
 */

import { eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { db } from '../db/index.js';
import { meetings } from '../db/schema/meetings.js';
import { organizations, projects } from '../db/schema/organizations.js';
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

      const currentUser =
        workspaceMembers.find((member) => member.id === request.user?.userId) ?? null;

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
