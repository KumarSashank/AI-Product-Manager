'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { projectsApi, Project } from '@/lib/api';

function permissionBadge(permission?: Project['permission']) {
  switch (permission) {
    case 'owner':
      return 'bg-[#eff6ff] text-[#1d4ed8] border-[#1d4ed8]/15';
    case 'editor':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'viewer':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [newProject, setNewProject] = useState({ name: '', description: '', googleMeetLink: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectsApi.list();
      setProjects(res.projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectsApi.create({
        name: newProject.name,
        description: newProject.description || undefined,
        googleMeetLink: newProject.googleMeetLink || undefined,
        isRecurring: !!newProject.googleMeetLink,
      });
      setShowModal(false);
      setNewProject({ name: '', description: '', googleMeetLink: '' });
      loadProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
            Projects
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(13,77,170,0.14)] transition hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4ed8] border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="rounded-[1.8rem] border border-black/6 bg-white/78 py-20 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#eff6ff]">
            <svg
              className="h-8 w-8 text-[#1d4ed8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <h3 className="mb-1 font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
            No projects yet
          </h3>
          <p className="mb-6 text-sm text-[var(--ink-soft)]">
            Create your first project to start tracking meetings
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5"
          >
            Create Project
          </button>
        </div>
      ) : (
        /* Project Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group rounded-[1.6rem] border border-black/6 bg-white/82 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-1 hover:border-black/10 hover:shadow-[0_24px_56px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff]">
                  <svg
                    className="h-5 w-5 text-[#1d4ed8]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  {project.permission && (
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] ${permissionBadge(
                        project.permission
                      )}`}
                    >
                      {project.permission}
                    </span>
                  )}
                  {project.isRecurring && (
                    <span className="rounded-md border border-[#1d4ed8]/20 bg-[#eff6ff] px-2 py-0.5 text-[11px] text-[#1d4ed8]">
                      Recurring
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-md border ${
                      project.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              <h3 className="mb-1 text-[15px] font-semibold text-[var(--ink-strong)] transition group-hover:text-[#1d4ed8]">
                {project.name}
              </h3>

              {project.description && (
                <p className="mb-3 line-clamp-2 text-sm text-[var(--ink-soft)]">
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-4 border-t border-black/6 pt-3 text-xs text-[var(--ink-soft)]">
                <span className="flex items-center gap-1.5">
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
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {project.meetingCount || 0} meetings
                </span>
                <span className="flex items-center gap-1.5">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {project.taskCount || 0} items
                </span>
                <span className="ml-auto">{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && search && (
            <div className="col-span-full py-12 text-center text-sm text-[var(--ink-soft)]">
              No projects match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,32,50,0.26)] px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
            <h2 className="mb-5 font-[family:var(--font-display)] text-3xl tracking-[-0.03em] text-[var(--ink-strong)]">
              Create New Project
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.9)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                  placeholder="Sprint Planning, Daily Standup..."
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                  Description <span className="text-[var(--ink-soft)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.9)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                  placeholder="Weekly team sync for sprint progress"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                  Google Meet Link <span className="text-[var(--ink-soft)]">(optional)</span>
                </label>
                <input
                  type="url"
                  value={newProject.googleMeetLink}
                  onChange={(e) => setNewProject({ ...newProject, googleMeetLink: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.9)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
                <p className="mt-1.5 text-xs text-[var(--ink-soft)]">
                  For recurring meetings, paste the same link to group sessions together.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-black/8 bg-slate-100 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
