/**
 * @fileoverview Project Routes
 * @description CRUD operations for projects with meeting link support
 */

import { eq, desc, or, and, isNull } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import { db } from '../db/index.js';
import { meetingItems } from '../db/schema/meetingItems.js';
import { meetings } from '../db/schema/meetings.js';
import { moms } from '../db/schema/mom.js';
import { projects } from '../db/schema/organizations.js';
import { projectCollaborators } from '../db/schema/projectCollaborators.js';
import { users } from '../db/schema/users.js';
import { requireOrganizationId, requireProjectAccess } from '../lib/access.js';

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  googleMeetLink: z.string().url().optional(),
  isRecurring: z.boolean().optional().default(false),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  googleMeetLink: z.string().url().optional().nullable(),
  isRecurring: z.boolean().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

const createCollaboratorSchema = z.object({
  userId: z.string().uuid('A valid workspace user is required'),
  role: z.enum(['viewer', 'editor']).default('viewer'),
});

const updateCollaboratorSchema = z.object({
  role: z.enum(['viewer', 'editor']),
});

async function getAcceptedCollaborators(projectId: string) {
  const collaborators = await db
    .select()
    .from(projectCollaborators)
    .where(
      and(
        eq(projectCollaborators.projectId, projectId),
        eq(projectCollaborators.status, 'accepted')
      )
    );

  const collaboratorUserIds = collaborators
    .map((collaborator) => collaborator.userId)
    .filter((userId): userId is string => Boolean(userId));

  const workspaceUsers = collaboratorUserIds.length
    ? await db
        .select()
        .from(users)
        .where(or(...collaboratorUserIds.map((userId) => eq(users.id, userId))))
    : [];

  const usersById = new Map(workspaceUsers.map((user) => [user.id, user]));

  return collaborators.map((collaborator) => {
    const user = collaborator.userId ? usersById.get(collaborator.userId) : null;

    return {
      id: collaborator.id,
      userId: collaborator.userId,
      email: collaborator.email,
      role: collaborator.role,
      status: collaborator.status,
      acceptedAt: collaborator.acceptedAt,
      createdAt: collaborator.createdAt,
      displayName: user?.displayName ?? collaborator.email,
      isActive: user?.isActive ?? true,
    };
  });
}

export async function projectRoutes(server: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/projects - List all projects
   */
  server.get('/api/v1/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const allProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, organizationId))
        .orderBy(desc(projects.updatedAt));

      const userId = request.user?.userId ?? null;
      const userEmail = request.user?.email?.toLowerCase() ?? null;
      let accessibleProjects = allProjects;
      let collaboratorPermissions = new Map<string, 'viewer' | 'editor'>();

      if (request.user?.role !== 'admin') {
        const collaboratorConditions = [];
        if (userId) {
          collaboratorConditions.push(eq(projectCollaborators.userId, userId));
        }
        if (userEmail) {
          collaboratorConditions.push(eq(projectCollaborators.email, userEmail));
        }

        const collaboratorRows =
          collaboratorConditions.length > 0
            ? await db
                .select()
                .from(projectCollaborators)
                .where(
                  and(
                    eq(projectCollaborators.status, 'accepted'),
                    collaboratorConditions.length === 1
                      ? collaboratorConditions[0]!
                      : or(...collaboratorConditions)
                  )
                )
            : [];

        collaboratorPermissions = new Map(
          collaboratorRows.map((collaborator) => [
            collaborator.projectId,
            collaborator.role === 'editor' ? 'editor' : 'viewer',
          ])
        );

        accessibleProjects = allProjects.filter(
          (project) =>
            (userId && project.createdBy === userId) || collaboratorPermissions.has(project.id)
        );
      }

      // Get meeting/task counts
      const projectsWithCounts = await Promise.all(
        accessibleProjects.map(async (project) => {
          // Build conditions: always check projectId, optionally check googleMeetLink
          const conditions = [eq(meetings.projectId, project.id)];
          if (project.googleMeetLink) {
            conditions.push(eq(meetings.googleMeetLink, project.googleMeetLink));
          }

          const meetingResult = await db
            .select()
            .from(meetings)
            .where(
              and(
                eq(meetings.organizationId, organizationId),
                conditions.length > 1 ? or(...conditions) : conditions[0]!
              )
            );
          const meetingCount = meetingResult.length;

          let taskCount = 0;
          for (const meeting of meetingResult) {
            const items = await db
              .select()
              .from(meetingItems)
              .where(eq(meetingItems.meetingId, meeting.id));
            taskCount += items.length;
          }

          const permission =
            request.user?.role === 'admin' || (userId && project.createdBy === userId)
              ? 'owner'
              : (collaboratorPermissions.get(project.id) ?? 'viewer');

          return { ...project, meetingCount, taskCount, permission };
        })
      );

      return reply.send({ projects: projectsWithCounts });
    } catch (error) {
      console.error('List projects error:', error);
      return reply.status(500).send({ error: 'Failed to list projects' });
    }
  });

  /**
   * POST /api/v1/projects - Create a new project
   */
  server.post('/api/v1/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const body = createProjectSchema.parse(request.body);

      const [project] = await db
        .insert(projects)
        .values({
          organizationId,
          createdBy: request.user?.userId ?? null,
          name: body.name,
          description: body.description ?? null,
          googleMeetLink: body.googleMeetLink ?? null,
          isRecurring: body.isRecurring ?? false,
        })
        .returning();

      return reply.status(201).send({ project });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed', details: error.errors });
      }
      console.error('Create project error:', error);
      return reply.status(500).send({ error: 'Failed to create project' });
    }
  });

  /**
   * GET /api/v1/projects/:id - Get project with meetings and tasks
   */
  server.get('/api/v1/projects/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const access = await requireProjectAccess(request, reply, id);
      if (!access) return;
      const { project, permission } = access;

      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      // Get meetings associated with this project (by projectId OR (by meet link IF unassigned))
      const conditions: any[] = [eq(meetings.projectId, project.id)];
      if (project.googleMeetLink) {
        conditions.push(
          and(eq(meetings.googleMeetLink, project.googleMeetLink), isNull(meetings.projectId))
        );
      }

      const projectMeetings = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.organizationId, organizationId),
            conditions.length > 1 ? or(...conditions) : conditions[0]!
          )
        )
        .orderBy(desc(meetings.startTime));

      const projectItems: (typeof meetingItems.$inferSelect)[] = [];
      const projectMoms: Record<string, typeof moms.$inferSelect> = {};

      for (const meeting of projectMeetings) {
        const items = await db
          .select()
          .from(meetingItems)
          .where(eq(meetingItems.meetingId, meeting.id));
        projectItems.push(...items);

        // Fetch MoM for this meeting
        const [mom] = await db.select().from(moms).where(eq(moms.meetingId, meeting.id)).limit(1);
        if (mom) {
          projectMoms[meeting.id] = mom;
        }
      }

      const owner =
        project.createdBy != null
          ? ((
              await db
                .select({
                  id: users.id,
                  email: users.email,
                  displayName: users.displayName,
                  role: users.role,
                })
                .from(users)
                .where(eq(users.id, project.createdBy))
                .limit(1)
            )[0] ?? null)
          : null;

      const collaborators = await getAcceptedCollaborators(project.id);

      return reply.send({
        project,
        permissions: {
          role: permission,
          canEditProject: permission === 'owner',
          canManageCollaborators: permission === 'owner',
          canEditItems: permission === 'owner' || permission === 'editor',
        },
        collaborators: {
          owner,
          members: collaborators,
        },
        meetings: projectMeetings,
        items: projectItems,
        moms: projectMoms,
        stats: {
          totalMeetings: projectMeetings.length,
          totalItems: projectItems.length,
          pendingItems: projectItems.filter((i) => i.status === 'pending').length,
          completedItems: projectItems.filter((i) => i.status === 'completed').length,
        },
      });
    } catch (error) {
      console.error('Get project error:', error);
      return reply.status(500).send({ error: 'Failed to get project' });
    }
  });

  /**
   * PATCH /api/v1/projects/:id - Update a project
   */
  server.patch('/api/v1/projects/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateProjectSchema.parse(request.body);

      const access = await requireProjectAccess(request, reply, id, 'owner');
      if (!access) return;

      const [updated] = await db
        .update(projects)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();

      return reply.send({ project: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed', details: error.errors });
      }
      console.error('Update project error:', error);
      return reply.status(500).send({ error: 'Failed to update project' });
    }
  });

  /**
   * POST /api/v1/projects/:id/link - Add or update meeting link
   */
  server.post('/api/v1/projects/:id/link', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { googleMeetLink } = z.object({ googleMeetLink: z.string().url() }).parse(request.body);

      const access = await requireProjectAccess(request, reply, id, 'owner');
      if (!access) return;

      const [updated] = await db
        .update(projects)
        .set({ googleMeetLink, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();

      return reply.send({ project: updated, message: 'Meeting link updated' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid meeting link' });
      }
      console.error('Update link error:', error);
      return reply.status(500).send({ error: 'Failed to update meeting link' });
    }
  });

  /**
   * DELETE /api/v1/projects/:id - Delete a project
   */
  server.delete('/api/v1/projects/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const access = await requireProjectAccess(request, reply, id, 'owner');
      if (!access) return;

      await db.delete(projects).where(eq(projects.id, id));
      return reply.send({ success: true, message: 'Project deleted' });
    } catch (error) {
      console.error('Delete project error:', error);
      return reply.status(500).send({ error: 'Failed to delete project' });
    }
  });

  server.get(
    '/api/v1/projects/:id/collaborators',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const access = await requireProjectAccess(request, reply, id);
        if (!access) return;

        const owner =
          access.project.createdBy != null
            ? ((
                await db
                  .select({
                    id: users.id,
                    email: users.email,
                    displayName: users.displayName,
                    role: users.role,
                  })
                  .from(users)
                  .where(eq(users.id, access.project.createdBy))
                  .limit(1)
              )[0] ?? null)
            : null;

        return reply.send({
          collaborators: {
            owner,
            members: await getAcceptedCollaborators(id),
          },
        });
      } catch (error) {
        console.error('List project collaborators error:', error);
        return reply.status(500).send({ error: 'Failed to list project collaborators' });
      }
    }
  );

  server.post<{ Params: { id: string } }>(
    '/api/v1/projects/:id/collaborators',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const access = await requireProjectAccess(request, reply, id, 'owner');
        if (!access) return;

        const body = createCollaboratorSchema.parse(request.body);

        const [member] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);

        if (!member || member.organizationId !== access.project.organizationId) {
          return reply.status(404).send({ error: 'Workspace member not found' });
        }

        if (access.project.createdBy === member.id) {
          return reply.status(409).send({ error: 'Project owner already has access' });
        }

        const [existingCollaborator] = await db
          .select()
          .from(projectCollaborators)
          .where(
            and(eq(projectCollaborators.projectId, id), eq(projectCollaborators.userId, member.id))
          )
          .limit(1);

        let collaborator;

        if (existingCollaborator) {
          [collaborator] = await db
            .update(projectCollaborators)
            .set({
              email: member.email,
              role: body.role,
              status: 'accepted',
              acceptedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(projectCollaborators.id, existingCollaborator.id))
            .returning();
        } else {
          [collaborator] = await db
            .insert(projectCollaborators)
            .values({
              projectId: id,
              userId: member.id,
              email: member.email,
              role: body.role,
              status: 'accepted',
              invitedBy: request.user?.userId ?? null,
              acceptedAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
        }

        if (!collaborator) {
          return reply.status(500).send({ error: 'Failed to persist project collaborator' });
        }

        return reply.status(201).send({
          collaborator: {
            id: collaborator.id,
            userId: collaborator.userId,
            email: collaborator.email,
            role: collaborator.role,
            status: collaborator.status,
            acceptedAt: collaborator.acceptedAt,
            createdAt: collaborator.createdAt,
            displayName: member.displayName,
            isActive: member.isActive,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Validation failed', details: error.errors });
        }

        console.error('Add project collaborator error:', error);
        return reply.status(500).send({ error: 'Failed to add project collaborator' });
      }
    }
  );

  server.patch<{ Params: { id: string; collaboratorId: string } }>(
    '/api/v1/projects/:id/collaborators/:collaboratorId',
    async (request, reply) => {
      try {
        const { id, collaboratorId } = request.params;
        const access = await requireProjectAccess(request, reply, id, 'owner');
        if (!access) return;

        const body = updateCollaboratorSchema.parse(request.body);

        const [existingCollaborator] = await db
          .select()
          .from(projectCollaborators)
          .where(
            and(
              eq(projectCollaborators.id, collaboratorId),
              eq(projectCollaborators.projectId, id),
              eq(projectCollaborators.status, 'accepted')
            )
          )
          .limit(1);

        if (!existingCollaborator) {
          return reply.status(404).send({ error: 'Collaborator not found' });
        }

        const [updatedCollaborator] = await db
          .update(projectCollaborators)
          .set({ role: body.role, updatedAt: new Date() })
          .where(eq(projectCollaborators.id, collaboratorId))
          .returning();

        if (!updatedCollaborator) {
          return reply.status(500).send({ error: 'Failed to update collaborator' });
        }

        const member =
          updatedCollaborator.userId != null
            ? ((
                await db
                  .select()
                  .from(users)
                  .where(eq(users.id, updatedCollaborator.userId))
                  .limit(1)
              )[0] ?? null)
            : null;

        return reply.send({
          collaborator: {
            id: updatedCollaborator.id,
            userId: updatedCollaborator.userId,
            email: updatedCollaborator.email,
            role: updatedCollaborator.role,
            status: updatedCollaborator.status,
            acceptedAt: updatedCollaborator.acceptedAt,
            createdAt: updatedCollaborator.createdAt,
            displayName: member?.displayName ?? updatedCollaborator.email,
            isActive: member?.isActive ?? true,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: 'Validation failed', details: error.errors });
        }

        console.error('Update project collaborator error:', error);
        return reply.status(500).send({ error: 'Failed to update collaborator' });
      }
    }
  );

  server.delete<{ Params: { id: string; collaboratorId: string } }>(
    '/api/v1/projects/:id/collaborators/:collaboratorId',
    async (request, reply) => {
      try {
        const { id, collaboratorId } = request.params;
        const access = await requireProjectAccess(request, reply, id, 'owner');
        if (!access) return;

        const [existingCollaborator] = await db
          .select()
          .from(projectCollaborators)
          .where(
            and(
              eq(projectCollaborators.id, collaboratorId),
              eq(projectCollaborators.projectId, id),
              eq(projectCollaborators.status, 'accepted')
            )
          )
          .limit(1);

        if (!existingCollaborator) {
          return reply.status(404).send({ error: 'Collaborator not found' });
        }

        await db.delete(projectCollaborators).where(eq(projectCollaborators.id, collaboratorId));
        return reply.send({ success: true });
      } catch (error) {
        console.error('Delete project collaborator error:', error);
        return reply.status(500).send({ error: 'Failed to remove collaborator' });
      }
    }
  );
}
