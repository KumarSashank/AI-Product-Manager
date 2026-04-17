/**
 * @fileoverview Authentication Service
 * @description Handles user authentication, password hashing, and JWT tokens
 */

import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

import { DEFAULT_DEV_ORG_ID } from '../db/bootstrap.js';
import { db } from '../db/index.js';
import { organizations, workspaceInvitations } from '../db/schema/organizations.js';
import { users, type User, type NewUser } from '../db/schema/users.js';

/** Strip passwordHash from a user record */
function omitPassword(user: User): Omit<User, 'passwordHash'> {
  const {
    id,
    email,
    displayName,
    organizationId,
    role,
    isActive,
    createdAt,
    updatedAt,
    lastLoginAt,
  } = user;
  return {
    id,
    email,
    displayName,
    organizationId,
    role,
    isActive,
    createdAt,
    updatedAt,
    lastLoginAt,
  };
}

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRY = '7d';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function resolveInvitationForSignup(inviteToken: string, email: string) {
  const [invitation] = await db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.token, inviteToken))
    .limit(1);

  if (!invitation || invitation.status !== 'pending') {
    throw new Error('Invitation is no longer valid');
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error('Invitation has expired');
  }

  if (invitation.email.toLowerCase() !== email.trim().toLowerCase()) {
    throw new Error('Use the email address that was invited to this workspace');
  }

  return invitation;
}

async function ensureOrganizationForSignup(
  displayName: string,
  email: string,
  organizationId?: string,
  inviteToken?: string
): Promise<{ organizationId: string; role: string; invitationId?: string }> {
  if (inviteToken) {
    const invitation = await resolveInvitationForSignup(inviteToken, email);
    return {
      organizationId: invitation.organizationId,
      role: invitation.role,
      invitationId: invitation.id,
    };
  }

  if (organizationId) {
    const [existingOrganization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!existingOrganization) {
      throw new Error('Workspace not found');
    }

    return { organizationId: existingOrganization.id, role: 'member' };
  }

  const workspaceName = `${displayName.trim() || 'New'} Workspace`;
  const baseSlug = slugify(workspaceName) || 'workspace';
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const [createdOrganization] = await db
    .insert(organizations)
    .values({
      name: workspaceName,
      slug,
      isActive: true,
    })
    .returning();

  return {
    organizationId: createdOrganization?.id ?? DEFAULT_DEV_ORG_ID,
    role: 'admin',
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role: string;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  if (user.organizationId != null) {
    payload.organizationId = user.organizationId;
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Create a new user account
 */
export async function createUser(
  email: string,
  password: string,
  displayName: string,
  organizationId?: string,
  inviteToken?: string
): Promise<AuthResult> {
  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const organization = await ensureOrganizationForSignup(
    displayName,
    email,
    organizationId,
    inviteToken
  );

  const newUser: NewUser = {
    email,
    passwordHash,
    displayName,
    organizationId: organization.organizationId,
    role: organization.role,
  };

  const [created] = await db.insert(users).values(newUser).returning();

  if (!created) {
    throw new Error('Failed to create user');
  }

  const token = generateToken(created);

  if (organization.invitationId) {
    await db
      .update(workspaceInvitations)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workspaceInvitations.id, organization.invitationId));
  }

  return { user: omitPassword(created), token };
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const token = generateToken(user);

  return { user: omitPassword(user), token };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  if (!user) return null;

  return omitPassword(user);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<Omit<User, 'passwordHash'> | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) return null;

  return omitPassword(user);
}

export async function getInvitationByToken(token: string): Promise<{
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
} | null> {
  const [invitation] = await db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.token, token))
    .limit(1);

  if (!invitation) {
    return null;
  }

  const [workspace] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, invitation.organizationId))
    .limit(1);

  if (!workspace) {
    return null;
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    workspace,
  };
}
