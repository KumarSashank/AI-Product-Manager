'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  WorkspaceActivityEntry,
  Workspace,
  WorkspaceInvitation,
  WorkspaceInvitationCreateInput,
  WorkspaceMember,
  WorkspaceStats,
  WorkspaceUpdateInput,
  WorkspaceUser,
  workspaceApi,
} from '@/lib/api';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type InviteState = 'idle' | 'saving' | 'saved' | 'error';

function formatDate(value?: string | null): string {
  if (!value) return 'Not yet';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getInvitationStatus(invitation: WorkspaceInvitation): 'pending' | 'accepted' | 'expired' {
  if (invitation.status === 'accepted' || invitation.acceptedAt) {
    return 'accepted';
  }

  if (new Date(invitation.expiresAt).getTime() < Date.now()) {
    return 'expired';
  }

  return 'pending';
}

function invitationStatusTone(status: 'pending' | 'accepted' | 'expired'): string {
  switch (status) {
    case 'accepted':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'expired':
      return 'border-slate-200 bg-slate-100 text-slate-600';
    case 'pending':
    default:
      return 'border-[#1d4ed8]/15 bg-[#eff6ff] text-[#1d4ed8]';
  }
}

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [currentUser, setCurrentUser] = useState<WorkspaceUser | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [recentActivity, setRecentActivity] = useState<WorkspaceActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [inviteState, setInviteState] = useState<InviteState>('idle');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkspaceUpdateInput>({ name: '', logoUrl: '' });
  const [inviteForm, setInviteForm] = useState<WorkspaceInvitationCreateInput>({
    email: '',
    role: 'member',
  });

  useEffect(() => {
    void loadWorkspace();
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const dirty =
    workspace != null &&
    (form.name !== workspace.name || (form.logoUrl ?? '') !== (workspace.logoUrl ?? ''));

  const memberSummary = useMemo(() => {
    const activeMembers = members.filter((member) => member.isActive).length;
    return {
      activeMembers,
      inactiveMembers: Math.max(members.length - activeMembers, 0),
    };
  }, [members]);

  const pendingInvitations = useMemo(
    () => invitations.filter((invitation) => getInvitationStatus(invitation) === 'pending'),
    [invitations]
  );

  const historicalInvitations = useMemo(
    () => invitations.filter((invitation) => getInvitationStatus(invitation) !== 'pending'),
    [invitations]
  );

  const invitationSummary = useMemo(
    () => ({
      accepted: invitations.filter((invitation) => getInvitationStatus(invitation) === 'accepted')
        .length,
      expired: invitations.filter((invitation) => getInvitationStatus(invitation) === 'expired')
        .length,
    }),
    [invitations]
  );

  async function loadWorkspace() {
    setLoading(true);
    setError(null);

    try {
      const [workspaceResponse, membersResponse] = await Promise.all([
        workspaceApi.get(),
        workspaceApi.listMembers(),
      ]);

      const invitationsResponse =
        workspaceResponse.currentUser?.role === 'admin'
          ? await workspaceApi.listInvitations()
          : { invitations: [] };

      setWorkspace(workspaceResponse.workspace);
      setStats(workspaceResponse.stats);
      setCurrentUser(workspaceResponse.currentUser);
      setRecentActivity(workspaceResponse.recentActivity || []);
      setMembers(membersResponse.members);
      setInvitations(invitationsResponse.invitations);
      setForm({
        name: workspaceResponse.workspace.name,
        logoUrl: workspaceResponse.workspace.logoUrl ?? '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !dirty) return;

    setSaveState('saving');
    setSaveError(null);

    try {
      const response = await workspaceApi.update({
        name: form.name?.trim() || workspace.name,
        logoUrl: form.logoUrl?.trim() ? form.logoUrl.trim() : null,
      });

      setWorkspace(response.workspace);
      setForm({
        name: response.workspace.name,
        logoUrl: response.workspace.logoUrl ?? '',
      });
      setSaveState('saved');

      window.setTimeout(() => {
        setSaveState((current) => (current === 'saved' ? 'idle' : current));
      }, 2400);
    } catch (err) {
      setSaveState('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to update workspace');
    }
  }

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;

    setInviteState('saving');
    setInviteError(null);

    try {
      const response = await workspaceApi.createInvitation({
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      });

      setInvitations((current) =>
        [response.invitation, ...current].sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
      );
      setInviteForm({ email: '', role: 'member' });
      setInviteState('saved');

      window.setTimeout(() => {
        setInviteState((current) => (current === 'saved' ? 'idle' : current));
      }, 2400);
    } catch (err) {
      setInviteState('error');
      setInviteError(err instanceof Error ? err.message : 'Failed to create invitation');
    }
  }

  async function handleDeleteInvite(id: string) {
    try {
      await workspaceApi.deleteInvitation(id);
      setInvitations((current) => current.filter((invitation) => invitation.id !== id));
      setCopiedInviteId((current) => (current === id ? null : current));
    } catch (err) {
      setInviteState('error');
      setInviteError(err instanceof Error ? err.message : 'Failed to remove invitation');
    }
  }

  async function handleCopyInvite(invitation: WorkspaceInvitation) {
    const inviteUrl = `${window.location.origin}/signup?invite=${invitation.token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteId(invitation.id);

    window.setTimeout(() => {
      setCopiedInviteId((current) => (current === invitation.id ? null : current));
    }, 2200);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4ed8] border-t-transparent" />
      </div>
    );
  }

  if (error || !workspace || !stats || !currentUser) {
    return (
      <div className="rounded-[1.6rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error || 'Workspace could not be loaded.'}
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] space-y-6">
      <section className="rounded-[2rem] border border-black/6 bg-white/82 p-7 shadow-[0_18px_52px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-[#1d4ed8]/15 bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">
              Workspace settings
            </span>
            <div>
              <h1 className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
                {workspace.name}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--ink-soft)]">
                This workspace owns its own projects, meetings, transcripts, and AI memory. It now
                also supports shareable collaborator invites, which makes the tenancy model visible
                and usable instead of purely internal.
              </p>
            </div>
          </div>

          <div className="grid min-w-[260px] gap-3 rounded-[1.5rem] border border-black/6 bg-[linear-gradient(180deg,#f8fbff,#fffdf8)] p-4 text-sm text-[var(--ink-soft)]">
            <div className="flex items-center justify-between">
              <span>Workspace slug</span>
              <code className="rounded-md bg-black/[0.04] px-2 py-1 text-xs text-[var(--ink-strong)]">
                {workspace.slug}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span>Your role</span>
              <span className="rounded-md border border-black/8 px-2 py-1 text-xs font-medium text-[var(--ink-strong)]">
                {currentUser.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Created</span>
              <span className="text-[var(--ink-strong)]">{formatDate(workspace.createdAt)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Members', value: stats.memberCount, hint: `${stats.adminCount} admins` },
          {
            label: 'Active projects',
            value: stats.activeProjectCount,
            hint: `${stats.projectCount} total`,
          },
          { label: 'Meetings', value: stats.meetingCount, hint: 'Stored in this workspace' },
          {
            label: 'Active users',
            value: memberSummary.activeMembers,
            hint: `${memberSummary.inactiveMembers} inactive`,
          },
          {
            label: 'Pending invites',
            value: pendingInvitations.length,
            hint:
              invitationSummary.accepted > 0
                ? `${invitationSummary.accepted} accepted`
                : 'Direct signup links',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[1.4rem] border border-black/6 bg-white/82 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]"
          >
            <p className="text-sm text-[var(--ink-soft)]">{card.label}</p>
            <p className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[1.8rem] border border-black/6 bg-white/84 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#1d4ed8]">Recent activity</p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
              Workspace timeline
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
              A lightweight operational feed makes the workspace feel accountable and alive, not
              just configured.
            </p>
          </div>
          <span className="rounded-full border border-black/8 px-3 py-1 text-xs text-[var(--ink-soft)]">
            {recentActivity.length} recent events
          </span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-[rgba(248,251,255,0.7)] px-4 py-8 text-center text-sm text-[var(--ink-soft)]">
            Workspace activity will appear here as projects, meetings, and invitations move forward.
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((entry) => (
              <Link
                key={entry.id}
                href={entry.href}
                className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4 transition hover:border-black/12"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                      {entry.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--ink-strong)]">
                    {entry.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{entry.description}</p>
                </div>
                <span className="text-xs text-[var(--ink-soft)]">
                  {formatDate(entry.occurredAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSave}
          className="rounded-[1.8rem] border border-black/6 bg-white/84 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]"
        >
          <div className="mb-5">
            <h2 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
              General settings
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Keep the workspace identity clean and consistent before we add richer collaboration.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                Workspace name
              </label>
              <input
                type="text"
                value={form.name ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                disabled={!isAdmin || saveState === 'saving'}
                className="w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.9)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 disabled:cursor-not-allowed disabled:opacity-70"
                placeholder="Acme Product Workspace"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                Workspace logo URL
              </label>
              <input
                type="url"
                value={form.logoUrl ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, logoUrl: event.target.value }))
                }
                disabled={!isAdmin || saveState === 'saving'}
                className="w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.9)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 disabled:cursor-not-allowed disabled:opacity-70"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#f8fbff,#fffef8)] p-4 text-sm text-[var(--ink-soft)]">
              <p className="font-medium text-[var(--ink-strong)]">Why this matters</p>
              <p className="mt-1">
                Public SaaS products feel trustworthy when workspaces are clearly scoped. This page
                makes the private-tenant model visible instead of hidden in backend logic.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!isAdmin || !dirty || saveState === 'saving'}
              className="rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(13,77,170,0.14)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveState === 'saving' ? 'Saving...' : 'Save workspace'}
            </button>
            {!isAdmin && (
              <span className="text-sm text-[var(--ink-soft)]">
                Only workspace admins can change these settings.
              </span>
            )}
            {saveState === 'saved' && (
              <span className="text-sm text-emerald-600">Workspace details saved.</span>
            )}
            {saveState === 'error' && saveError && (
              <span className="text-sm text-rose-600">{saveError}</span>
            )}
          </div>
        </form>

        <div className="rounded-[1.8rem] border border-black/6 bg-white/84 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-5">
            <h2 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
              Membership snapshot
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              The current tenant model is account-specific. Collaboration now starts with member
              visibility and shareable invites.
            </p>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--ink-strong)]">
                      {member.displayName}
                    </p>
                    {member.isCurrentUser && (
                      <span className="rounded-full border border-[#1d4ed8]/15 bg-[#eff6ff] px-2 py-0.5 text-[11px] text-[#1d4ed8]">
                        You
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[var(--ink-soft)]">{member.email}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    Joined {formatDate(member.createdAt)} - Last active{' '}
                    {formatDate(member.lastLoginAt)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium ${
                      member.role === 'admin'
                        ? 'border-[#1d4ed8]/15 bg-[#eff6ff] text-[#1d4ed8]'
                        : 'border-black/8 bg-black/[0.03] text-[var(--ink-strong)]'
                    }`}
                  >
                    {member.role}
                  </span>
                  <span
                    className={`text-xs ${
                      member.isActive ? 'text-emerald-600' : 'text-[var(--ink-soft)]'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isAdmin ? (
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleInviteSubmit}
            className="rounded-[1.8rem] border border-black/6 bg-white/84 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]"
          >
            <div className="mb-5">
              <h2 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
                Invite collaborators
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Create a direct signup link for this workspace. Email delivery is still manual, but
                the invitation model is now real and scoped.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                  Invite email
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm((current) => ({ ...current, email: event.target.value }))
                  }
                  disabled={inviteState === 'saving'}
                  className="w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.9)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="collaborator@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                  Access role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm((current) => ({
                      ...current,
                      role: event.target.value as WorkspaceInvitationCreateInput['role'],
                    }))
                  }
                  disabled={inviteState === 'saving'}
                  className="w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.9)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#f8fbff,#fffef8)] p-4 text-sm text-[var(--ink-soft)]">
                <p className="font-medium text-[var(--ink-strong)]">Current behavior</p>
                <p className="mt-1">
                  Invites are valid for 7 days and currently support one workspace per account. That
                  keeps the collaboration model honest while we design broader multi-workspace
                  support.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={inviteState === 'saving'}
                className="rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(13,77,170,0.14)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {inviteState === 'saving' ? 'Creating invite...' : 'Create invite'}
              </button>
              {inviteState === 'saved' && (
                <span className="text-sm text-emerald-600">Invitation created.</span>
              )}
              {inviteError && <span className="text-sm text-rose-600">{inviteError}</span>}
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-[1.8rem] border border-black/6 bg-white/84 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
                    Pending invitations
                  </h2>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Share the signup link directly today. Delivery automation and richer acceptance
                    flows are the next collaboration milestone.
                  </p>
                </div>
                <span className="rounded-full border border-black/8 px-3 py-1 text-xs text-[var(--ink-soft)]">
                  {pendingInvitations.length} pending
                </span>
              </div>

              {pendingInvitations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 bg-[rgba(248,251,255,0.7)] px-4 py-8 text-center text-sm text-[var(--ink-soft)]">
                  No invitations yet. Create one to generate a workspace join link.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => {
                    const effectiveStatus = getInvitationStatus(invitation);

                    return (
                      <div
                        key={invitation.id}
                        className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--ink-strong)]">
                              {invitation.email}
                            </p>
                            <p className="mt-1 text-xs text-[var(--ink-soft)]">
                              {invitation.role} access • created {formatDate(invitation.createdAt)}
                            </p>
                            <p className="mt-1 text-xs text-[var(--ink-soft)]">
                              Invited by{' '}
                              {invitation.invitedByName ||
                                invitation.invitedByEmail ||
                                'workspace admin'}{' '}
                              • expires {formatDate(invitation.expiresAt)}
                            </p>
                          </div>
                          <span
                            className={`rounded-md border px-2 py-1 text-[11px] ${invitationStatusTone(effectiveStatus)}`}
                          >
                            {effectiveStatus}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleCopyInvite(invitation)}
                            className="rounded-lg border border-black/8 px-3 py-2 text-sm font-medium text-[var(--ink-strong)] transition hover:bg-black/[0.03]"
                          >
                            {copiedInviteId === invitation.id ? 'Copied link' : 'Copy signup link'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteInvite(invitation.id)}
                            className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-black/6 bg-white/84 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
                    Invitation history
                  </h2>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Keep a lightweight audit trail of accepted and expired workspace invites.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    {invitationSummary.accepted} accepted
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-600">
                    {invitationSummary.expired} expired
                  </span>
                </div>
              </div>

              {historicalInvitations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 bg-[rgba(248,251,255,0.7)] px-4 py-8 text-center text-sm text-[var(--ink-soft)]">
                  Invitation history will appear here once links are accepted or expire.
                </div>
              ) : (
                <div className="space-y-3">
                  {historicalInvitations.map((invitation) => {
                    const effectiveStatus = getInvitationStatus(invitation);

                    return (
                      <div
                        key={invitation.id}
                        className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--ink-strong)]">
                              {invitation.email}
                            </p>
                            <p className="mt-1 text-xs text-[var(--ink-soft)]">
                              Invited by{' '}
                              {invitation.invitedByName ||
                                invitation.invitedByEmail ||
                                'workspace admin'}{' '}
                              on {formatDate(invitation.createdAt)}
                            </p>
                            <p className="mt-1 text-xs text-[var(--ink-soft)]">
                              {effectiveStatus === 'accepted'
                                ? `Accepted ${formatDate(invitation.acceptedAt)}`
                                : `Expired ${formatDate(invitation.expiresAt)}`}
                            </p>
                          </div>
                          <span
                            className={`rounded-md border px-2 py-1 text-[11px] ${invitationStatusTone(effectiveStatus)}`}
                          >
                            {effectiveStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[1.8rem] border border-black/6 bg-white/84 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <h2 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
            Collaboration access
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            Invitation management is limited to workspace admins. Member visibility is already live,
            and admin-managed invite links are now part of the workspace model.
          </p>
        </section>
      )}
    </div>
  );
}
