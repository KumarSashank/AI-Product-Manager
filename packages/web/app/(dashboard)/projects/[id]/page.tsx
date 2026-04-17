'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { ItemsWorkspace } from '@/components/items/ItemsWorkspace';
import { TranscriptUpload } from '@/components/transcript/TranscriptUpload';
import {
  botApi,
  meetingItemsApi,
  Meeting,
  MeetingItem,
  MeetingItemStatus,
  MeetingItemUpdateInput,
  MoM,
  Project,
  ProjectCollaborator,
  ProjectCollaborators,
  ProjectPermissions,
  ProjectStats,
  projectsApi,
  WorkspaceMember,
  workspaceApi,
} from '@/lib/api';

function buildProjectStats(items: MeetingItem[], meetingsCount: number): ProjectStats {
  return {
    totalMeetings: meetingsCount,
    totalItems: items.length,
    pendingItems: items.filter((item) => item.status === 'pending').length,
    completedItems: items.filter((item) => item.status === 'completed').length,
  };
}

function formatMemberLabel(name?: string | null, fallback?: string | null): string {
  return name?.trim() || fallback?.trim() || 'Unnamed member';
}

function roleTone(role: 'owner' | 'editor' | 'viewer') {
  switch (role) {
    case 'owner':
      return 'bg-[#eff6ff] text-[#1d4ed8] border-[#1d4ed8]/15';
    case 'editor':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'viewer':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null);
  const [collaborators, setCollaborators] = useState<ProjectCollaborators>({
    owner: null,
    members: [],
  });
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [items, setItems] = useState<MeetingItem[]>([]);
  const [moms, setMoms] = useState<Record<string, MoM>>({});
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'chat'>('overview');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');

  // Collaboration state
  const [collaborationError, setCollaborationError] = useState<string | null>(null);
  const [collaborationBusyId, setCollaborationBusyId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer');

  // Bot state
  const [botSessionId, setBotSessionId] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<string>('idle');
  const [botStarting, setBotStarting] = useState(false);

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!permissions?.canManageCollaborators) {
      setWorkspaceMembers([]);
      setSelectedMemberId('');
      return;
    }

    void loadWorkspaceMembers();
  }, [permissions?.canManageCollaborators]);

  const canEditProject = permissions?.canEditProject ?? false;
  const canManageCollaborators = permissions?.canManageCollaborators ?? false;
  const canEditItems = permissions?.canEditItems ?? false;
  const canContributeMeetings = permissions?.role === 'owner' || permissions?.role === 'editor';

  const meetingsById = useMemo(
    () =>
      meetings.reduce<Record<string, Meeting>>((accumulator, meeting) => {
        accumulator[meeting.id] = meeting;
        return accumulator;
      }, {}),
    [meetings]
  );

  const availableWorkspaceMembers = useMemo(() => {
    if (!canManageCollaborators) return [];

    const existingMemberIds = new Set(
      collaborators.members.map((collaborator) => collaborator.userId).filter(Boolean)
    );
    const ownerId = collaborators.owner?.id ?? null;

    return workspaceMembers.filter(
      (member) => member.id !== ownerId && !existingMemberIds.has(member.id)
    );
  }, [canManageCollaborators, collaborators, workspaceMembers]);

  async function loadProject() {
    setLoading(true);
    setError(null);

    try {
      const res = await projectsApi.get(projectId);
      setProject(res.project);
      setPermissions(res.permissions);
      setCollaborators(res.collaborators);
      setMeetings(res.meetings);
      setItems(res.items);
      setMoms(res.moms || {});
      setStats(res.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspaceMembers() {
    try {
      const response = await workspaceApi.listMembers();
      setWorkspaceMembers(response.members);
    } catch (err) {
      setCollaborationError(
        err instanceof Error ? err.message : 'Failed to load workspace members'
      );
    }
  }

  async function handleAddLink() {
    if (!meetingLink || !canEditProject) return;
    try {
      await projectsApi.updateLink(projectId, meetingLink);
      setShowLinkModal(false);
      setMeetingLink('');
      await loadProject();
    } catch (err) {
      setCollaborationError(err instanceof Error ? err.message : 'Failed to add meeting link');
    }
  }

  async function handleStartBot() {
    if (!project?.googleMeetLink || !canContributeMeetings) return;
    setBotStarting(true);
    try {
      const res = await botApi.join(project.googleMeetLink, project.name);
      setBotSessionId(res.sessionId);
      setBotStatus('starting');
    } catch (err) {
      console.error('Failed to start bot:', err);
      setBotStatus('error');
    } finally {
      setBotStarting(false);
    }
  }

  async function handleStopBot() {
    if (!botSessionId || !canContributeMeetings) return;
    try {
      await botApi.stop(botSessionId);
      setBotStatus('stopped');
      setBotSessionId(null);
    } catch (err) {
      console.error('Failed to stop bot:', err);
    }
  }

  useEffect(() => {
    if (!botSessionId || ['stopped', 'error', 'idle'].includes(botStatus)) return;
    const interval = setInterval(async () => {
      try {
        const res = await botApi.status(botSessionId);
        setBotStatus(res.status);
        if (['stopped', 'error'].includes(res.status)) clearInterval(interval);
      } catch {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [botSessionId, botStatus]);

  async function handleItemStatusChange(itemId: string, status: MeetingItemStatus) {
    if (!canEditItems) return;

    const response = await meetingItemsApi.updateStatus(itemId, status, 'project_workspace');
    const updatedItem = response.item;

    setItems((current) => {
      const nextItems = current.map((item) =>
        item.id === itemId ? { ...item, ...updatedItem } : item
      );
      setStats(buildProjectStats(nextItems, meetings.length));
      return nextItems;
    });
  }

  async function handleItemUpdate(itemId: string, updates: MeetingItemUpdateInput) {
    if (!canEditItems) return;

    const response = await meetingItemsApi.update(itemId, updates);
    const updatedItem = response.item;

    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...updatedItem } : item))
    );
  }

  async function handleAddCollaborator() {
    if (!canManageCollaborators || !selectedMemberId) return;

    setCollaborationBusyId('add');
    setCollaborationError(null);

    try {
      const response = await projectsApi.addCollaborator(projectId, {
        userId: selectedMemberId,
        role: selectedRole,
      });

      setCollaborators((current) => ({
        ...current,
        members: [...current.members, response.collaborator].sort((left, right) =>
          formatMemberLabel(left.displayName, left.email).localeCompare(
            formatMemberLabel(right.displayName, right.email)
          )
        ),
      }));
      setSelectedMemberId('');
      setSelectedRole('viewer');
    } catch (err) {
      setCollaborationError(
        err instanceof Error ? err.message : 'Failed to add project collaborator'
      );
    } finally {
      setCollaborationBusyId(null);
    }
  }

  async function handleCollaboratorRoleChange(
    collaborator: ProjectCollaborator,
    role: 'viewer' | 'editor'
  ) {
    if (!canManageCollaborators || collaborator.role === role) return;

    setCollaborationBusyId(collaborator.id);
    setCollaborationError(null);

    try {
      const response = await projectsApi.updateCollaborator(projectId, collaborator.id, { role });
      setCollaborators((current) => ({
        ...current,
        members: current.members.map((member) =>
          member.id === collaborator.id ? response.collaborator : member
        ),
      }));
    } catch (err) {
      setCollaborationError(
        err instanceof Error ? err.message : 'Failed to update collaborator role'
      );
    } finally {
      setCollaborationBusyId(null);
    }
  }

  async function handleRemoveCollaborator(collaborator: ProjectCollaborator) {
    if (!canManageCollaborators) return;

    const confirmed = window.confirm(
      `Remove ${formatMemberLabel(collaborator.displayName, collaborator.email)} from this project?`
    );
    if (!confirmed) return;

    setCollaborationBusyId(collaborator.id);
    setCollaborationError(null);

    try {
      await projectsApi.removeCollaborator(projectId, collaborator.id);
      setCollaborators((current) => ({
        ...current,
        members: current.members.filter((member) => member.id !== collaborator.id),
      }));
    } catch (err) {
      setCollaborationError(err instanceof Error ? err.message : 'Failed to remove collaborator');
    } finally {
      setCollaborationBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4ed8] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.6rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!project || !permissions) {
    return (
      <div className="text-center py-20">
        <h2 className="mb-4 text-xl text-[var(--ink-strong)]">Project not found</h2>
        <Link href="/projects" className="text-sm text-[#1d4ed8] hover:text-[#0f3fae]">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-muted)] transition hover:text-[var(--ink-strong)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to projects
        </Link>
        {meetings.length > 0 && (
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)] transition hover:text-[var(--ink-strong)]"
          >
            All meetings
          </Link>
        )}
      </div>

      <section className="rounded-[1.8rem] border border-black/6 bg-white/84 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${roleTone(permissions.role)}`}
              >
                {permissions.role === 'owner'
                  ? 'Project owner'
                  : permissions.role === 'editor'
                    ? 'Project editor'
                    : 'Project viewer'}
              </span>
              <span className="text-xs text-[var(--ink-soft)]">
                Workspace access is now scoped per project instead of shared globally.
              </span>
            </div>
            <div>
              <h1 className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{project.description}</p>
              )}
            </div>
            <div className="max-w-2xl rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#f8fbff,#fffef8)] px-4 py-3 text-sm text-[var(--ink-soft)]">
              {permissions.role === 'owner'
                ? 'You can manage project settings, collaborators, meeting capture, and action-item execution from this workspace.'
                : permissions.role === 'editor'
                  ? 'You can contribute meetings, transcripts, and action-item updates, but owner-only settings stay protected.'
                  : 'You currently have view-only access. Meetings, items, and project memory remain visible, while project changes stay protected.'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canContributeMeetings && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-600/10 px-3.5 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-600/15"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Transcript
              </button>
            )}

            {!project.googleMeetLink && canEditProject && (
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex items-center gap-2 rounded-xl border border-black/8 bg-white px-3.5 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:border-black/12 hover:text-[var(--ink-strong)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Add Meet Link
              </button>
            )}
          </div>
        </div>
      </section>

      {stats && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Meetings', value: stats.totalMeetings, color: 'text-[var(--ink-strong)]' },
            { label: 'Total Items', value: stats.totalItems, color: 'text-[var(--ink-strong)]' },
            { label: 'Pending', value: stats.pendingItems, color: 'text-amber-600' },
            { label: 'Completed', value: stats.completedItems, color: 'text-emerald-600' },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[1.3rem] border border-black/6 bg-white/82 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]"
            >
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{card.label}</p>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {project.googleMeetLink && (
          <div className="rounded-[1.4rem] border border-black/6 bg-white/84 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff6ff]">
                  <svg
                    className="h-4 w-4 text-[#1d4ed8]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink-strong)]">Meeting Link</p>
                  <a
                    href={project.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-[#1d4ed8] transition hover:text-[#0f3fae]"
                  >
                    {project.googleMeetLink}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {botStatus !== 'idle' && botStatus !== 'stopped' && botStatus !== 'error' && (
                  <span className="mr-2 flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                        botStatus === 'in_meeting' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                    />
                    {botStatus.replace('_', ' ')}
                  </span>
                )}

                {canContributeMeetings ? (
                  botStatus === 'idle' || botStatus === 'stopped' || botStatus === 'error' ? (
                    <button
                      onClick={handleStartBot}
                      disabled={botStarting}
                      className="rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-3 py-1.5 text-xs font-medium text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {botStarting ? 'Starting...' : 'Join with Bot'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStopBot}
                      className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-500/20"
                    >
                      Stop Bot
                    </button>
                  )
                ) : (
                  <span className="rounded-md border border-black/8 px-2.5 py-1 text-xs text-[var(--ink-soft)]">
                    View only
                  </span>
                )}
              </div>
            </div>

            {!canContributeMeetings && (
              <p className="mt-3 text-xs text-[var(--ink-soft)]">
                Bot capture and transcript uploads are limited to project owners and editors.
              </p>
            )}
          </div>
        )}

        <div className="rounded-[1.6rem] border border-black/6 bg-white/84 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <div className="mb-4">
            <h2 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
              Project access
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Owners can share this project with selected workspace members. Editors can contribute
              meetings and items. Viewers can follow the project without changing it.
            </p>
          </div>

          <div className="space-y-3">
            {collaborators.owner && (
              <div className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#f8fbff,#fffef8)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                      Owner
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--ink-strong)]">
                      {formatMemberLabel(
                        collaborators.owner.displayName,
                        collaborators.owner.email
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {collaborators.owner.email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${roleTone('owner')}`}
                  >
                    Owner
                  </span>
                </div>
              </div>
            )}

            {collaborators.members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-[rgba(248,251,255,0.75)] p-4 text-sm text-[var(--ink-soft)]">
                No additional collaborators yet. Project access is currently limited to the owner.
              </div>
            ) : (
              collaborators.members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/6 bg-white p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--ink-strong)]">
                      {formatMemberLabel(member.displayName, member.email)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageCollaborators ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(event) =>
                            void handleCollaboratorRoleChange(
                              member,
                              event.target.value as 'viewer' | 'editor'
                            )
                          }
                          disabled={collaborationBusyId === member.id}
                          className="rounded-lg border border-black/10 bg-[rgba(248,251,255,0.9)] px-3 py-2 text-xs font-medium text-[var(--ink-strong)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          onClick={() => void handleRemoveCollaborator(member)}
                          disabled={collaborationBusyId === member.id}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${roleTone(member.role)}`}
                      >
                        {member.role === 'editor' ? 'Editor' : 'Viewer'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {canManageCollaborators && (
            <div className="mt-5 rounded-2xl border border-black/6 bg-[rgba(248,251,255,0.84)] p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-[var(--ink-strong)]">Add collaborator</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  Share this project with a workspace member and choose whether they should edit or
                  only review the work.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                <select
                  value={selectedMemberId}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[var(--ink-strong)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                >
                  <option value="">Select workspace member</option>
                  {availableWorkspaceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {formatMemberLabel(member.displayName, member.email)} ({member.email})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as 'viewer' | 'editor')}
                  className="rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[var(--ink-strong)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>

                <button
                  onClick={() => void handleAddCollaborator()}
                  disabled={
                    collaborationBusyId === 'add' ||
                    !selectedMemberId ||
                    availableWorkspaceMembers.length === 0
                  }
                  className="rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {collaborationBusyId === 'add' ? 'Adding...' : 'Add'}
                </button>
              </div>

              {availableWorkspaceMembers.length === 0 && (
                <p className="mt-3 text-xs text-[var(--ink-soft)]">
                  Every eligible workspace member already has access to this project.
                </p>
              )}
            </div>
          )}

          {collaborationError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
              {collaborationError}
            </div>
          )}
        </div>
      </section>

      <div className="flex gap-1 border-b border-black/8">
        {[
          { key: 'overview' as const, label: 'Meetings' },
          { key: 'items' as const, label: 'Action Items', count: items.length },
          { key: 'chat' as const, label: 'Ask AI' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-[2px] flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'border-[#1d4ed8] text-[var(--ink-strong)]'
                : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink-strong)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs ${
                  activeTab === tab.key
                    ? 'bg-[#eff6ff] text-[#1d4ed8]'
                    : 'bg-slate-100 text-[var(--ink-soft)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          {meetings.length === 0 ? (
            <div className="rounded-[1.8rem] border border-black/6 bg-white/82 py-16 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eff6ff]">
                <svg
                  className="h-7 w-7 text-[#1d4ed8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-1 text-base font-medium text-[var(--ink-strong)]">
                No meetings yet
              </h3>
              <p className="text-sm text-[var(--ink-soft)]">
                {canContributeMeetings
                  ? 'Upload a transcript or use the bot to capture your first meeting.'
                  : 'Meetings added by the owner or editors will appear here automatically.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.5rem] border border-black/6 bg-white/84 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/6 bg-[#f8fbff]">
                    <th className="w-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                      Meeting
                    </th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                      Status
                    </th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                      Segments
                    </th>
                    <th className="w-20 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                      MoM
                    </th>
                    <th className="w-36 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                      Date
                    </th>
                    <th className="w-16 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting, index) => {
                    const hasMom = Boolean(moms[meeting.id]);
                    return (
                      <tr
                        key={meeting.id}
                        className="group border-b border-black/5 transition hover:bg-[#f8fbff]"
                      >
                        <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">{index + 1}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/meetings/${meeting.id}`}
                            className="text-sm font-medium text-[var(--ink-strong)] transition hover:text-[#1d4ed8]"
                          >
                            {meeting.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {meeting.status === 'in_progress' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                              Live
                            </span>
                          ) : (
                            <span className="text-xs capitalize text-[var(--ink-soft)]">
                              {meeting.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--ink-muted)]">
                          {meeting.totalTranscriptEvents || 0}
                        </td>
                        <td className="px-4 py-3">
                          {hasMom ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[#0891b2]">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--ink-soft)]">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">
                          {meeting.startTime
                            ? new Date(meeting.startTime).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '--'}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/meetings/${meeting.id}`}
                            className="text-xs text-[#1d4ed8] opacity-0 transition group-hover:opacity-100 hover:text-[#0f3fae]"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'items' && (
        <ItemsWorkspace
          items={items}
          meetingsById={meetingsById}
          workspaceKey={`project:${projectId}`}
          emptyMessage="No items yet. Upload a transcript or join a meeting to extract action items, blockers, decisions, and follow-ups."
          onStatusChange={canEditItems ? handleItemStatusChange : undefined}
          onItemUpdate={canEditItems ? handleItemUpdate : undefined}
        />
      )}

      {activeTab === 'chat' && <ChatInterface projectId={projectId} />}

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,32,50,0.26)] px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
            <h2 className="mb-5 font-[family:var(--font-display)] text-3xl tracking-[-0.03em] text-[var(--ink-strong)]">
              Add Meeting Link
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                  Google Meet Link
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(event) => setMeetingLink(event.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.9)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 rounded-xl border border-black/8 bg-slate-100 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleAddLink()}
                  className="flex-1 rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <TranscriptUpload
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={loadProject}
        />
      )}
    </div>
  );
}
