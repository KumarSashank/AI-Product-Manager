/**
 * @fileoverview Authentication Routes
 * @description Signup, signin, and user profile endpoints
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import * as authService from '../services/auth.service.js';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  organizationId: z.string().uuid().optional(),
  inviteToken: z.string().min(1).optional(),
});

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function resolveSameSite(): 'lax' | 'strict' | 'none' {
  const configuredValue = process.env.COOKIE_SAME_SITE?.toLowerCase();

  if (configuredValue === 'strict' || configuredValue === 'none' || configuredValue === 'lax') {
    return configuredValue;
  }

  return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
}

function buildCookieOptions() {
  const sameSite = resolveSameSite();
  const secure = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production' || sameSite === 'none';
  const domain = process.env.COOKIE_DOMAIN;

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    ...(domain ? { domain } : {}),
  };
}

function buildClearCookieOptions() {
  const { domain, path, sameSite, secure } = buildCookieOptions();

  return {
    path,
    sameSite,
    secure,
    ...(domain ? { domain } : {}),
  };
}

export async function authRoutes(server: FastifyInstance): Promise<void> {
  /**
   * POST /auth/signup - Create a new user account
   */
  server.post('/api/v1/auth/signup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = signupSchema.parse(request.body);

      const { user, token } = await authService.createUser(
        body.email,
        body.password,
        body.displayName,
        body.organizationId,
        body.inviteToken
      );

      reply.setCookie('auth_token', token, buildCookieOptions());

      return reply.status(201).send({
        success: true,
        user,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.status(409).send({ error: error.message });
      }

      console.error('Signup error:', error);
      return reply.status(500).send({ error: 'Failed to create account' });
    }
  });

  /**
   * GET /auth/invite/:token - Resolve a public invite preview
   */
  server.get(
    '/api/v1/auth/invite/:token',
    async (request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) => {
      try {
        const invitation = await authService.getInvitationByToken(request.params.token);

        if (!invitation) {
          return reply.status(404).send({ error: 'Invitation not found' });
        }

        if (invitation.status !== 'pending') {
          return reply.status(410).send({ error: 'Invitation is no longer valid' });
        }

        if (invitation.expiresAt < new Date()) {
          return reply.status(410).send({ error: 'Invitation has expired' });
        }

        return reply.send({ invitation });
      } catch (error) {
        console.error('Get invitation error:', error);
        return reply.status(500).send({ error: 'Failed to load invitation' });
      }
    }
  );

  /**
   * POST /auth/signin - Login with email and password
   */
  server.post('/api/v1/auth/signin', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = signinSchema.parse(request.body);

      const { user, token } = await authService.signIn(body.email, body.password);

      reply.setCookie('auth_token', token, buildCookieOptions());

      return reply.send({
        success: true,
        user,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message.includes('Invalid')) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      if (error instanceof Error && error.message.includes('deactivated')) {
        return reply.status(403).send({ error: 'Account is deactivated' });
      }

      console.error('Signin error:', error);
      return reply.status(500).send({ error: 'Failed to sign in' });
    }
  });

  /**
   * POST /auth/logout - Clear auth cookie
   */
  server.post('/api/v1/auth/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('auth_token', buildClearCookieOptions());
    return reply.send({ success: true });
  });

  /**
   * GET /auth/me - Get current user profile
   */
  server.get('/api/v1/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.cookies.auth_token;

      if (!token) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const payload = authService.verifyToken(token);

      if (!payload) {
        reply.clearCookie('auth_token', buildClearCookieOptions());
        return reply.status(401).send({ error: 'Invalid or expired token' });
      }

      const user = await authService.getUserById(payload.userId);

      if (!user) {
        reply.clearCookie('auth_token', buildClearCookieOptions());
        return reply.status(401).send({ error: 'User not found' });
      }

      return reply.send({ user });
    } catch (error) {
      console.error('Get me error:', error);
      return reply.status(500).send({ error: 'Failed to get user' });
    }
  });
}
