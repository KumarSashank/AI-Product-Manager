'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Workspace,
  WorkspaceMember,
  WorkspaceStats,
  WorkspaceUpdateInput,
  WorkspaceUser,
  workspaceApi,
} from '@/lib/api';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function formatDate(value?: string | null): string {
  if (!value) return 'Not yet';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [currentUser, setCurrentUser] = useState<WorkspaceUser | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<WorkspaceUpdateInput>({ name: '', logoUrl: '' });

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

  async function loadWorkspace() {
    setLoading(true);
    setError(null);

    try {
      const [workspaceResponse, membersResponse] = await Promise.all([
        workspaceApi.get(),
        workspaceApi.listMembers(),
      ]);

      setWorkspace(workspaceResponse.workspace);
      setStats(workspaceResponse.stats);
      setCurrentUser(workspaceResponse.currentUser);
      setMembers(membersResponse.members);
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
                This workspace owns its own projects, meetings, transcripts, and AI memory. The next
                SaaS slice will build invitations and collaborator onboarding on top of this
                foundation.
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
            label: 'Last sign-in',
            value: formatDate(currentUser.lastLoginAt),
            hint: currentUser.email,
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
              Keep the workspace identity clean and consistent before we add invites and external
              collaboration.
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
              The current tenant model is account-specific. Invitations and external collaborator
              onboarding are the next backlog slice.
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
    </div>
  );
}
