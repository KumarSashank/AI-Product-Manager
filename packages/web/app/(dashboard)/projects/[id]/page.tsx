'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  ProjectStats,
  projectsApi,
} from '@/lib/api';

function buildProjectStats(items: MeetingItem[], meetingsCount: number): ProjectStats {
  return {
    totalMeetings: meetingsCount,
    totalItems: items.length,
    pendingItems: items.filter((item) => item.status === 'pending').length,
    completedItems: items.filter((item) => item.status === 'completed').length,
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [items, setItems] = useState<MeetingItem[]>([]);
  const [moms, setMoms] = useState<Record<string, MoM>>({});
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'chat'>('overview');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');

  // Bot state
  const [botSessionId, setBotSessionId] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<string>('idle');
  const [botStarting, setBotStarting] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await projectsApi.get(projectId);
      setProject(res.project);
      setMeetings(res.meetings);
      setItems(res.items);
      setMoms(res.moms || {});
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!meetingLink) return;
    try {
      await projectsApi.updateLink(projectId, meetingLink);
      setShowLinkModal(false);
      setMeetingLink('');
      loadProject();
    } catch (err) {
      console.error('Failed to add link:', err);
    }
  };

  const handleStartBot = async () => {
    if (!project?.googleMeetLink) return;
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
  };

  const handleStopBot = async () => {
    if (!botSessionId) return;
    try {
      await botApi.stop(botSessionId);
      setBotStatus('stopped');
      setBotSessionId(null);
    } catch (err) {
      console.error('Failed to stop bot:', err);
    }
  };

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

  const meetingsById = meetings.reduce<Record<string, Meeting>>((accumulator, meeting) => {
    accumulator[meeting.id] = meeting;
    return accumulator;
  }, {});

  const handleItemStatusChange = async (itemId: string, status: MeetingItemStatus) => {
    const response = await meetingItemsApi.updateStatus(itemId, status, 'project_workspace');
    const updatedItem = response.item;

    setItems((current) => {
      const nextItems = current.map((item) =>
        item.id === itemId ? { ...item, ...updatedItem } : item
      );
      setStats(buildProjectStats(nextItems, meetings.length));
      return nextItems;
    });
  };

  const handleItemUpdate = async (itemId: string, updates: MeetingItemUpdateInput) => {
    const response = await meetingItemsApi.update(itemId, updates);
    const updatedItem = response.item;

    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...updatedItem } : item))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4ed8] border-t-transparent" />
      </div>
    );
  }

  if (!project) {
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
    <div className="max-w-[1200px]">
      <div className="flex flex-wrap items-center gap-3 mb-5">
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

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 rounded-lg bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-600/20 transition flex items-center gap-2"
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

          {!project.googleMeetLink && (
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

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Meetings', value: stats.totalMeetings, color: 'text-[var(--ink-strong)]' },
            { label: 'Total Items', value: stats.totalItems, color: 'text-[var(--ink-strong)]' },
            { label: 'Pending', value: stats.pendingItems, color: 'text-amber-600' },
            { label: 'Completed', value: stats.completedItems, color: 'text-emerald-600' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[1.3rem] border border-black/6 bg-white/82 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Capture Options (if link exists) */}
      {project.googleMeetLink && (
        <div className="mb-6 rounded-[1.4rem] border border-black/6 bg-white/84 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
              <div>
                <p className="text-sm font-medium text-[var(--ink-strong)]">Meeting Link</p>
                <a
                  href={project.googleMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#1d4ed8] transition hover:text-[#0f3fae] break-all"
                >
                  {project.googleMeetLink}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {botStatus !== 'idle' && botStatus !== 'stopped' && botStatus !== 'error' && (
                <span className="mr-2 flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${botStatus === 'in_meeting' ? 'bg-green-400' : 'bg-yellow-400'}`}
                  />
                  {botStatus.replace('_', ' ')}
                </span>
              )}
              {botStatus === 'idle' || botStatus === 'stopped' || botStatus === 'error' ? (
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
                  className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition"
                >
                  Stop Bot
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-black/8">
        {[
          { key: 'overview' as const, label: 'Meetings' },
          { key: 'items' as const, label: 'Action Items', count: items.length },
          { key: 'chat' as const, label: 'Ask AI' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-[#1d4ed8] text-[var(--ink-strong)]'
                : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink-strong)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md ${
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

      {/* ── Meetings Tab ── */}
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
                Upload a transcript or use the bot to capture your first meeting.
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
                  {meetings.map((meeting, i) => {
                    const hasMom = !!moms[meeting.id];
                    return (
                      <tr
                        key={meeting.id}
                        className="group border-b border-black/5 transition hover:bg-[#f8fbff]"
                      >
                        <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">{i + 1}</td>
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
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
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

      {/* ── Items Tab ── */}
      {activeTab === 'items' && (
        <ItemsWorkspace
          items={items}
          meetingsById={meetingsById}
          workspaceKey={`project:${projectId}`}
          emptyMessage="No items yet. Upload a transcript or join a meeting to extract action items, blockers, decisions, and follow-ups."
          onStatusChange={handleItemStatusChange}
          onItemUpdate={handleItemUpdate}
        />
      )}

      {/* ── Chat Tab ── */}
      {activeTab === 'chat' && <ChatInterface projectId={projectId} />}

      {/* Add Link Modal */}
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
                  onChange={(e) => setMeetingLink(e.target.value)}
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
                  onClick={handleAddLink}
                  className="flex-1 rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Transcript Modal */}
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
