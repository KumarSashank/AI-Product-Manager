'use client';

import { MeetingItem } from '@/lib/api';

interface TaskListProps {
  items: MeetingItem[];
}

const itemTypeConfig: Record<string, { color: string; label: string }> = {
  action_item: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Action' },
  decision: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Decision' },
  blocker: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Blocker' },
  risk: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Risk' },
  idea: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Idea' },
  question: { color: 'bg-violet-50 text-violet-700 border-violet-200', label: 'Question' },
  announcement: { color: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Announce' },
  project_update: { color: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Update' },
  commitment: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Commit' },
  deadline: { color: 'bg-pink-50 text-pink-700 border-pink-200', label: 'Deadline' },
  dependency: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Dependency' },
  parking_lot: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Parked' },
  key_takeaway: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Takeaway' },
  reference: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Reference' },
};

export function TaskList({ items }: TaskListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.4rem] border border-black/6 bg-white/82 py-12 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff]">
          <svg
            className="h-6 w-6 text-[#1d4ed8]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-sm text-[var(--ink-soft)]">
          No items yet. Upload a transcript or join a meeting to extract items.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const typeInfo = itemTypeConfig[item.itemType] || {
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          label: item.itemType,
        };

        return (
          <div
            key={item.id}
            className="rounded-[1.2rem] border border-black/6 bg-white/82 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 px-2 py-0.5 text-[11px] rounded-md border flex-shrink-0 ${typeInfo.color}`}
              >
                {typeInfo.label}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[var(--ink-strong)]">{item.title}</h4>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-soft)]">
                    {item.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--ink-soft)]">
                  {item.assignee && (
                    <span className="flex items-center gap-1">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] text-[9px] font-bold text-white">
                        {item.assignee.charAt(0).toUpperCase()}
                      </div>
                      {item.assignee}
                    </span>
                  )}
                  {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                  {item.priority && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        item.priority === 'critical'
                          ? 'bg-red-50 text-red-700'
                          : item.priority === 'high'
                            ? 'bg-orange-50 text-orange-700'
                            : item.priority === 'medium'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.priority}
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      item.status === 'completed'
                        ? 'bg-green-50 text-green-700'
                        : item.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
