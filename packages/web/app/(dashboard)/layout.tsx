'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { authApi, User } from '@/lib/api';

const navItems = [
  {
    label: 'Projects',
    href: '/projects',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => router.push('/signin'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/signin');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-base)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4ed8] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#fffdf8_38%,#fcfcf8_100%)]">
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-black/6 bg-white/88 backdrop-blur-xl transition-all duration-200 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-black/6 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] text-white shadow-[0_14px_28px_rgba(13,77,170,0.18)]">
            <LogoGlyph />
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="font-[family:var(--font-display)] text-lg tracking-[-0.03em] text-[var(--ink-strong)]">
                AI Product Manager
              </p>
              <p className="text-xs text-[var(--ink-soft)]">Execution workspace</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[linear-gradient(135deg,rgba(29,78,216,0.12),rgba(8,145,178,0.1))] text-[var(--ink-strong)]'
                    : 'text-[var(--ink-muted)] hover:bg-black/[0.03] hover:text-[var(--ink-strong)]'
                }`}
              >
                <span className={isActive ? 'text-[#1d4ed8]' : 'text-[var(--ink-soft)]'}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mx-3 mb-2 rounded-xl p-2 text-[var(--ink-soft)] transition hover:bg-black/[0.03] hover:text-[var(--ink-strong)]"
        >
          <svg
            className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="border-t border-black/6 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] text-xs font-bold text-white">
              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink-strong)]">
                    {user?.displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--ink-soft)]">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md p-1.5 text-[var(--ink-soft)] transition hover:bg-black/[0.04] hover:text-[var(--ink-strong)]"
                  title="Sign out"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <div
        className={`flex-1 transition-all duration-200 ${
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[248px]'
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-black/6 bg-[rgba(252,252,248,0.84)] px-8 backdrop-blur-xl">
          <Breadcrumbs pathname={pathname} />
        </header>

        <main className="max-w-[1400px] px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean);

  const crumbs: { label: string; href?: string }[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    const href = '/' + segments.slice(0, i + 1).join('/');

    if (seg === 'projects') {
      crumbs.push({ label: 'Projects', href });
    } else if (seg === 'meetings' && i === 0) {
      crumbs.push({ label: 'Meetings', href });
    } else if (i > 0 && segments[i - 1] === 'projects') {
      crumbs.push({ label: 'Project detail', href });
    } else if (i > 0 && segments[i - 1] === 'meetings') {
      crumbs.push({ label: 'Meeting detail' });
    }
  }

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {crumbs.map((crumb, index) => (
        <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
          {index > 0 && (
            <svg
              className="h-3.5 w-3.5 text-[var(--ink-soft)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {crumb.href && index < crumbs.length - 1 ? (
            <Link
              href={crumb.href}
              className="text-[var(--ink-muted)] transition hover:text-[var(--ink-strong)]"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-[var(--ink-strong)]">{crumb.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function LogoGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M4 6.5C4 5.11929 5.11929 4 6.5 4H11V18H6.5C5.11929 18 4 16.8807 4 15.5V6.5Z"
        fill="currentColor"
      />
      <path
        d="M11 4H15.5C16.8807 4 18 5.11929 18 6.5V9.5H11V4Z"
        fill="currentColor"
        fillOpacity="0.72"
      />
      <path
        d="M11 12.5H18V15.5C18 16.8807 16.8807 18 15.5 18H11V12.5Z"
        fill="currentColor"
        fillOpacity="0.44"
      />
    </svg>
  );
}
