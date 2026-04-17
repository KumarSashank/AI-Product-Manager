'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { authApi } from '@/lib/api';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await authApi.signup(email, password, displayName);
      } else {
        await authApi.signin(email, password);
      }
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#fffdf8_42%,#fcfcf8_100%)] px-6 py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.12),transparent_28%)]" />

      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[0.95fr_0.9fr] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-[#1d4ed8]">
              Product execution workspace
            </p>
            <h1 className="mt-4 font-[family:var(--font-display)] text-5xl leading-[1.04] tracking-[-0.045em] text-[var(--ink-strong)]">
              Keep project context, accountability, and meeting evidence in one place.
            </h1>
            <p className="mt-6 text-lg leading-8 text-[var(--ink-muted)]">
              Sign in to manage project workspaces, review extracted items, and generate minutes of
              meeting with longitudinal context.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                'Structured project memory across meetings',
                'Owner-aware action items and deadline tracking',
                'Benchmark-backed transcript workflows',
                'Capture methods with explicit maturity states',
              ].map((point) => (
                <div
                  key={point}
                  className="rounded-[1.4rem] border border-black/5 bg-white/78 p-4 text-sm leading-6 text-[var(--ink-muted)] shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
                >
                  <div className="mb-3 h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mx-auto max-w-md rounded-[2rem] border border-black/5 bg-white/88 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] text-white shadow-[0_16px_30px_rgba(13,77,170,0.18)]">
                <LogoGlyph />
              </div>
              <h1 className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
                {isSignup ? 'Create your workspace account' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {isSignup ? 'Set up access to the project workspace.' : 'Sign in to continue.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <Field label="Full name">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={inputClassName}
                    placeholder="John Doe"
                    required
                  />
                </Field>
              )}

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClassName}
                  placeholder="you@example.com"
                  required
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClassName}
                  placeholder={isSignup ? 'At least 8 characters' : 'Enter password'}
                  minLength={isSignup ? 8 : undefined}
                  required
                />
              </Field>

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(13,77,170,0.16)] transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : isSignup ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-[var(--ink-soft)]">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Link
                  href={isSignup ? '/signin' : '/signup'}
                  className="font-medium text-[#1d4ed8] transition hover:text-[#0f3fae]"
                >
                  {isSignup ? 'Sign in' : 'Sign up'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">{label}</span>
      {children}
    </label>
  );
}

function LogoGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
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

const inputClassName =
  'w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.8)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20 focus:border-[#1d4ed8]/35 transition';
