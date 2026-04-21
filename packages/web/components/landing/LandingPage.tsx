'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';

import {
  benchmarkHeadline,
  benchmarkSuiteOverview,
  benchmarkSuiteResult,
} from '@/lib/research';

type ProductPanel = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  accent: string;
  icon: ReactNode;
};

type CaptureMethod = {
  label: string;
  status: string;
  description: string;
  notes: string[];
  tone: string;
};

const firstVisitSteps = [
  {
    title: 'Understand the workflow fast',
    copy:
      'The opening animation explains how meetings become structured work before anyone needs to sign in.',
  },
  {
    title: 'See the output clearly',
    copy:
      'Visitors should immediately understand that the app turns meetings into decisions, owners, next steps, and project memory.',
  },
  {
    title: 'Move into the workspace with context',
    copy:
      'Once the value is clear, the workspace feels like a natural next step instead of an early barrier.',
  },
];

const productPanels: ProductPanel[] = [
  {
    eyebrow: 'Capture',
    title: 'Bring in the meeting in the way that fits your team.',
    description:
      'Start with transcript upload today, then move into extension or live capture as the workflow matures.',
    points: [
      'Transcript upload works well for repeatable runs',
      'Audio recording is supported for extension capture',
      'Multiple capture paths stay reachable from one product surface',
    ],
    accent: 'from-[#31524b] to-[#79958c]',
    icon: <CaptureIcon />,
  },
  {
    eyebrow: 'Understand',
    title: 'Convert a meeting into structured, usable output.',
    description:
      'The product extracts action items, decisions, risks, questions, and deadlines before it writes the final note.',
    points: [
      'PM-style MoM instead of generic recap',
      'Owner-aware items and due-date context',
      'Evidence trace for why an item exists',
    ],
    accent: 'from-[#556a53] to-[#99ab87]',
    icon: <InsightIcon />,
  },
  {
    eyebrow: 'Track',
    title: 'Keep project memory alive across recurring meetings.',
    description:
      'The real value is not one summary. It is the ability to revisit open work, update status, and keep context across time.',
    points: [
      'Carry unresolved work into the next review',
      'Separate closed decisions from active risks',
      'Work inside a private workspace with collaborators',
    ],
    accent: 'from-[#8a6047] to-[#d3a27a]',
    icon: <TrackIcon />,
  },
];

const captureMethods: CaptureMethod[] = [
  {
    label: 'Transcript upload',
    status: 'Live',
    description:
      'Best route for most users today. It is fast, dependable, and easy to demo.',
    notes: [
      'Strong first-time user path',
      'Best for public demos and reliable evaluation',
      'Fastest way to experience the core workflow',
    ],
    tone: 'border-[#31524b]/16 bg-[linear-gradient(180deg,#ffffff,#eef3f0)]',
  },
  {
    label: 'Chrome extension',
    status: 'Beta',
    description:
      'Useful when you want lighter capture during Google Meet sessions. Audio is working, while multi-speaker transcription is still improving.',
    notes: [
      'Audio capture available',
      'Speaker attribution still being tuned',
      'Good for active product development demos',
    ],
    tone: 'border-[#556a53]/16 bg-[linear-gradient(180deg,#ffffff,#f2f4eb)]',
  },
  {
    label: 'Meeting bot',
    status: 'Preview',
    description:
      'Promising path for hands-free capture, but still limited by meeting permissions, waiting rooms, and auth friction.',
    notes: [
      'Best presented as an advanced capture option',
      'Keep expectations honest in public demos',
      'Better shown as a roadmap-facing capability today',
    ],
    tone: 'border-[#8a6047]/16 bg-[linear-gradient(180deg,#ffffff,#fbf2e8)]',
  },
];

function passRate(passed: number, failed: number): number {
  const total = passed + failed;
  return total === 0 ? 0 : Math.round((passed / total) * 100);
}

export default function LandingPage() {
  const rootRef = useRef<HTMLElement | null>(null);
  const suitePassRate = passRate(
    benchmarkSuiteResult.currentSystem.passed,
    benchmarkSuiteResult.currentSystem.failed
  );
  const baselinePassRate = passRate(
    benchmarkSuiteResult.transcriptOnly.passed,
    benchmarkSuiteResult.transcriptOnly.failed
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-hero-badge]', { y: 18, opacity: 0, duration: 0.45 })
        .from('[data-hero-title]', { y: 34, opacity: 0, duration: 0.72 }, '-=0.2')
        .from('[data-hero-copy]', { y: 24, opacity: 0, duration: 0.55 }, '-=0.42')
        .from('[data-hero-actions]', { y: 18, opacity: 0, duration: 0.45 }, '-=0.34')
        .from('[data-hero-stat]', { y: 14, opacity: 0, stagger: 0.08, duration: 0.36 }, '-=0.18')
        .from('[data-story-shell]', { y: 26, opacity: 0, duration: 0.75 }, '-=0.48');

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 38,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 84%',
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-bar-fill]').forEach((bar) => {
        const width = bar.dataset.width ?? '0%';
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width,
            duration: 1.05,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 88%',
            },
          }
        );
      });

      const storyScenes = gsap.utils.toArray<HTMLElement>('[data-story-scene]');
      const storyDots = gsap.utils.toArray<HTMLElement>('[data-story-dot]');

      if (storyScenes.length > 0) {
        gsap.set(storyScenes, { autoAlpha: 0, y: 16 });
        gsap.set(storyScenes[0], { autoAlpha: 1, y: 0 });

        const storyLoop = gsap.timeline({ repeat: -1, repeatDelay: 0.55 });

        storyScenes.forEach((scene, index) => {
          const lines = scene.querySelectorAll<HTMLElement>('[data-story-line]');

          storyLoop
            .to(storyScenes, { autoAlpha: 0, y: 16, duration: 0.2, ease: 'power2.out' })
            .to(
              storyDots,
              {
                scale: 1,
                backgroundColor: '#e5ddd2',
                borderColor: 'rgba(138,120,97,0.28)',
                duration: 0.18,
              },
              '<'
            )
            .set(lines, { autoAlpha: 0, y: 10 })
            .to(scene, { autoAlpha: 1, y: 0, duration: 0.38, ease: 'power3.out' }, '<')
            .to(
              `[data-story-dot="${index}"]`,
              {
                scale: 1.08,
                backgroundColor: '#31524b',
                borderColor: 'rgba(49,82,75,0.3)',
                duration: 0.18,
              },
              '<'
            )
            .to(
              lines,
              {
                autoAlpha: 1,
                y: 0,
                stagger: 0.08,
                duration: 0.3,
                ease: 'power2.out',
              },
              '<+0.08'
            )
            .to(
              scene,
              {
                y: -2,
                duration: 1.2,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: 1,
              },
              '<+0.1'
            );
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={rootRef}
      className="min-h-screen overflow-x-hidden bg-[var(--surface-base)] pb-28 text-[var(--ink-strong)] md:pb-16"
    >
      <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(87,115,106,0.16),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(184,145,108,0.12),_transparent_30%),linear-gradient(180deg,#fbf7f0_0%,#fcfaf5_48%,#ffffff_100%)]" />

      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3.5 lg:px-10 lg:py-4">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-3 pr-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#2d4743,#5f7c73)] text-white shadow-[0_16px_28px_rgba(45,71,67,0.18)] sm:h-11 sm:w-11 sm:rounded-2xl">
              <LogoGlyph />
            </div>
            <div className="min-w-0">
              <p className="truncate font-[family:var(--font-display)] text-[1.35rem] leading-none tracking-[-0.03em] sm:text-xl sm:tracking-[-0.02em]">
                AI Product Manager
              </p>
              <p className="mt-1 max-w-[10rem] text-[0.9rem] leading-[1.25] text-[var(--ink-muted)] sm:max-w-none sm:text-sm">
                Meeting memory for execution teams
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[var(--ink-muted)] md:flex">
            <a href="#story" className="transition hover:text-[var(--ink-strong)]">
              How it works
            </a>
            <a href="#product" className="transition hover:text-[var(--ink-strong)]">
              Product
            </a>
            <a href="#capture" className="transition hover:text-[var(--ink-strong)]">
              Capture
            </a>
            <a href="#proof" className="transition hover:text-[var(--ink-strong)]">
              Proof
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/signin"
              className="hidden rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-black/15 hover:bg-black/5 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,#2d4743,#5f7c73)] px-4 py-2.5 text-[0.95rem] font-semibold leading-none text-white shadow-[0_16px_28px_rgba(45,71,67,0.18)] transition hover:-translate-y-0.5 sm:px-5 sm:text-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-5 sm:pb-16 sm:pt-12 lg:grid-cols-[0.98fr_1.02fr] lg:px-10 lg:pb-24 lg:pt-18">
        <div className="max-w-3xl">
          <div
            data-hero-badge
            className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-[#31524b]/12 bg-white/88 px-3.5 py-2 text-[0.82rem] leading-5 text-[var(--ink-muted)] shadow-[0_18px_44px_rgba(15,23,42,0.05)] sm:gap-3 sm:px-4 sm:text-sm"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#5f7c73]" />
            Structured meeting memory for execution teams
          </div>

          <h1
            data-hero-title
            className="mt-6 max-w-4xl font-[family:var(--font-display)] text-[3.15rem] leading-[0.95] tracking-[-0.06em] text-[var(--ink-strong)] sm:mt-7 sm:text-6xl sm:leading-[1.02] sm:tracking-[-0.05em] lg:text-7xl"
          >
            Turn every meeting into decisions, owners, and next steps.
          </h1>

          <p
            data-hero-copy
            className="mt-6 max-w-2xl text-[1.02rem] leading-7 text-[var(--ink-muted)] sm:mt-7 sm:text-xl sm:leading-8"
          >
            AI Product Manager captures meeting input, extracts what matters, and keeps project
            context alive across time so your team can move from talk to execution faster.
          </p>

          <p
            data-hero-copy
            className="mt-4 max-w-2xl text-[0.98rem] leading-6 text-[var(--ink-soft)] sm:text-base sm:leading-7"
          >
            It starts with captured meeting evidence, moves into structured extraction, and ends in
            a workspace built for follow-through.
          </p>

          <div data-hero-actions className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-h-[3.35rem] w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#2d4743,#5f7c73)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_32px_rgba(45,71,67,0.18)] transition hover:-translate-y-0.5 sm:w-auto"
            >
              Create a workspace
            </Link>
            <a
              href="#story"
              className="inline-flex min-h-[3.35rem] w-full items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-base font-medium text-[var(--ink-strong)] transition hover:border-black/15 hover:bg-black/5 sm:w-auto"
            >
              See how it works
            </a>
          </div>

          <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-3">
            <StatCard
              value={`${suitePassRate}%`}
              label="Benchmark suite pass rate with stateful memory"
            />
            <StatCard
              value={`${benchmarkSuiteOverview.scenarioCount} scenarios`}
              label="Recurring-meeting stories in the current benchmark suite"
            />
            <StatCard value="Private workspaces" label="Account-scoped projects and collaborators" />
          </div>
        </div>

        <div data-story-shell className="relative">
          <div className="rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,243,236,0.94))] p-3 shadow-[0_28px_90px_rgba(15,23,42,0.1)] sm:rounded-[2.25rem] sm:p-4 lg:p-5">
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.8rem] border border-black/6 bg-[#22302d] p-2.5 shadow-[0_18px_44px_rgba(15,23,42,0.16)] sm:rounded-[2rem] sm:p-3">
                <div className="rounded-[1.45rem] bg-[linear-gradient(180deg,#fbf7f0,#f3ece0)] p-3 sm:rounded-[1.65rem] sm:p-4">
                  <div className="mx-auto h-1.5 w-24 rounded-full bg-black/12" />

                  <div className="mt-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[#5f7c73]">
                        How it works
                      </p>
                      <h2 className="mt-2 font-[family:var(--font-display)] text-[2rem] leading-none tracking-[-0.05em] text-[var(--ink-strong)] sm:text-3xl sm:tracking-[-0.04em]">
                        From conversation to execution
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((index) => (
                        <span
                          key={index}
                          data-story-dot={index}
                          className="h-2.5 w-2.5 rounded-full border border-[#d6cbbc] bg-[#e5ddd2]"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-5 min-h-[18rem] overflow-hidden rounded-[1.35rem] border border-black/6 bg-white/88 p-3 sm:mt-6 sm:min-h-[20rem] sm:rounded-[1.5rem] sm:p-4">
                    <StoryScene
                      title="1. Capture the meeting"
                      subtitle="Transcript, audio, or uploaded notes"
                      tone="bg-[#dce6df]"
                      lines={[
                        'Weekly launch review is captured',
                        'Speakers and context are preserved',
                        'The system starts from real meeting evidence',
                      ]}
                    />
                    <StoryScene
                      title="2. Extract what matters"
                      subtitle="Actions, decisions, blockers, and risks"
                      tone="bg-[#e6e1d5]"
                      lines={[
                        'Owners and due dates are identified',
                        'Risks and questions become structured items',
                        'The note is built after extraction, not before',
                      ]}
                    />
                    <StoryScene
                      title="3. Keep the project moving"
                      subtitle="Workspace, evidence trace, and status tracking"
                      tone="bg-[#ead9cd]"
                      lines={[
                        'Open work carries into the next meeting',
                        'Teams update status from the same workspace',
                        'Everyone sees what is done, blocked, or still open',
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.8rem] border border-black/6 bg-white/86 p-4 sm:space-y-4 sm:rounded-[2rem] sm:p-5">
                <div className="rounded-[1.25rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff,#f7f3ec)] p-4 sm:rounded-[1.4rem] sm:p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#5f7c73]">
                    What the product makes clear
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-muted)]">
                    <li>It captures meeting input.</li>
                    <li>It turns that input into structured work.</li>
                    <li>It keeps project memory alive across recurring reviews.</li>
                  </ul>
                </div>

                <div className="rounded-[1.25rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff,#faf4ec)] p-4 sm:rounded-[1.4rem] sm:p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8a6047]">
                    Why teams adopt it
                  </p>
                  <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
                    It does more than summarize a meeting. It preserves the work that still matters
                    after the call ends.
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff,#f3f0e8)] p-4 sm:rounded-[1.4rem] sm:p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#556a53]">
                    Best way to start
                  </p>
                  <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
                    Start with transcript upload for the cleanest experience, then explore extension
                    or live capture once the workflow is familiar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="story"
        data-reveal
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-5 lg:px-10 lg:py-14"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {firstVisitSteps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[1.6rem] border border-black/6 bg-white/86 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[1.8rem] sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,#2d4743,#5f7c73)] font-[family:var(--font-display)] text-[1.45rem] text-white shadow-[0_16px_30px_rgba(45,71,67,0.16)] sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                {index + 1}
              </div>
              <h3 className="mt-4 font-[family:var(--font-display)] text-[2rem] leading-[0.98] tracking-[-0.04em] text-[var(--ink-strong)] sm:mt-5 sm:text-3xl sm:tracking-[-0.03em]">
                {step.title}
              </h3>
              <p className="mt-3 text-[0.98rem] leading-6 text-[var(--ink-muted)] sm:mt-4 sm:text-base sm:leading-7">
                {step.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="product"
        className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-5 lg:px-10 lg:py-16"
      >
        <div data-reveal className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-[#5f7c73]">Product</p>
          <h2 className="mt-4 font-[family:var(--font-display)] text-[2.45rem] leading-[0.96] tracking-[-0.05em] text-[var(--ink-strong)] sm:text-5xl sm:tracking-[-0.04em]">
            A SaaS workflow, not just a page that writes meeting notes.
          </h2>
          <p className="mt-4 text-[1.02rem] leading-7 text-[var(--ink-muted)] sm:mt-5 sm:text-lg sm:leading-8">
            The product needs to feel clear on first visit and useful after sign-up. That means a
            clean story, honest states, and a workspace that supports real follow-through.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {productPanels.map((panel) => (
            <article
              key={panel.title}
              data-reveal
              className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-7"
            >
              <div
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${panel.accent} text-white shadow-[0_14px_28px_rgba(15,23,42,0.12)]`}
              >
                {panel.icon}
              </div>
              <p className="mt-6 text-sm uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                {panel.eyebrow}
              </p>
              <h3 className="mt-3 font-[family:var(--font-display)] text-[2rem] leading-[0.98] tracking-[-0.045em] text-[var(--ink-strong)] sm:text-3xl sm:leading-tight sm:tracking-[-0.035em]">
                {panel.title}
              </h3>
              <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
                {panel.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ink-muted)]">
                {panel.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--ink-strong)]/14" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="capture" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-5 lg:px-10 lg:py-16">
        <div data-reveal className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-[#556a53]">Capture</p>
          <h2 className="mt-4 font-[family:var(--font-display)] text-[2.45rem] leading-[0.96] tracking-[-0.05em] text-[var(--ink-strong)] sm:text-5xl sm:tracking-[-0.04em]">
            Honest capture states build trust.
          </h2>
          <p className="mt-4 text-[1.02rem] leading-7 text-[var(--ink-muted)] sm:mt-5 sm:text-lg sm:leading-8">
            Public SaaS products should tell people what works today and what is still under active
            improvement, especially when live meeting capture is involved.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {captureMethods.map((method) => (
            <article
              key={method.label}
              data-reveal
              className={`rounded-[1.7rem] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:rounded-[1.9rem] sm:p-7 ${method.tone}`}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-[family:var(--font-display)] text-[2rem] leading-[0.98] tracking-[-0.04em] text-[var(--ink-strong)] sm:text-3xl sm:tracking-[-0.03em]">
                  {method.label}
                </h3>
                <span className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                  {method.status}
                </span>
              </div>
              <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
                {method.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ink-muted)]">
                {method.notes.map((note) => (
                  <li key={note} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-black/14" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="proof" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-5 lg:px-10 lg:py-16">
        <div
          data-reveal
          className="overflow-hidden rounded-[2.2rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff,#f7f3ec)] shadow-[0_28px_90px_rgba(15,23,42,0.08)]"
        >
          <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-10">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#8a6047]">Proof</p>
              <h2 className="mt-4 font-[family:var(--font-display)] text-[2.45rem] leading-[0.96] tracking-[-0.05em] text-[var(--ink-strong)] sm:text-5xl sm:tracking-[-0.04em]">
                The product is benchmarked against recurring meeting scenarios, not just polished UI
                copy.
              </h2>
              <p className="mt-4 text-[1.02rem] leading-7 text-[var(--ink-muted)] sm:mt-5 sm:text-lg sm:leading-8">
                The current stateful system beats the transcript-only baseline across the live suite,
                which is exactly the behavior we want if project memory is adding real value.
              </p>

              <div className="mt-8 space-y-5">
                <BenchmarkBar
                  label="Stateful system"
                  value={`${benchmarkSuiteResult.currentSystem.passed} / ${benchmarkSuiteResult.currentSystem.failed}`}
                  sublabel={`${suitePassRate}% pass rate`}
                  width={`${suitePassRate}%`}
                  tone="bg-[linear-gradient(90deg,#31524b,#79958c)]"
                />
                <BenchmarkBar
                  label="Transcript-only baseline"
                  value={`${benchmarkSuiteResult.transcriptOnly.passed} / ${benchmarkSuiteResult.transcriptOnly.failed}`}
                  sublabel={`${baselinePassRate}% pass rate`}
                  width={`${baselinePassRate}%`}
                  tone="bg-[linear-gradient(90deg,#94a3b8,#64748b)]"
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/research"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-black/15 hover:bg-black/5"
                >
                  Open research page
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-black/15 hover:bg-black/5"
                >
                  Try the workspace
                </Link>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.6rem] border border-black/5 bg-white/90 p-5 sm:gap-5 sm:rounded-[1.8rem] sm:p-6">
              <ProofTile
                title={`${benchmarkSuiteResult.scenarioWins} of ${benchmarkSuiteOverview.scenarioCount} scenario wins`}
                body="The current system outperformed the transcript-only baseline across every committed benchmark scenario in the current suite."
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <ProofTile
                  title={`${benchmarkHeadline.currentSystem.passed} / ${benchmarkHeadline.currentSystem.failed}`}
                  body="Latest onboarding scenario result with project memory enabled."
                />
                <ProofTile
                  title={`${benchmarkSuiteOverview.scenarioCount} recurring stories`}
                  body="The benchmark suite now covers both onboarding execution and recovery-style coordination."
                />
              </div>
              <ProofTile
                title="Why this matters"
                body="A better product should not just write nicer notes. It should remember what stayed open, what changed, and what still blocks progress."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-5 lg:px-10 lg:pb-28">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-[linear-gradient(135deg,#22302d,#364a45)] px-5 py-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.16)] sm:rounded-[2.3rem] sm:px-7 sm:py-10 lg:px-10 lg:py-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(170,188,157,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(211,162,122,0.16),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.28em] text-[#d9c3a8]">Start here</p>
              <h2 className="mt-4 font-[family:var(--font-display)] text-[2.45rem] leading-[0.96] tracking-[-0.05em] sm:text-5xl sm:tracking-[-0.04em]">
                Open the product, run one meeting, and let the workspace show the follow-through.
              </h2>
              <p className="mt-4 text-[1.02rem] leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
                The landing page explains the value clearly. The workspace proves it with real
                meeting output, accountability, and follow-through.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/signup"
                className="inline-flex min-h-[3.35rem] w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition hover:-translate-y-0.5 sm:w-auto"
              >
                Create a workspace
              </Link>
              <Link
                href="/signin"
                className="inline-flex min-h-[3.35rem] w-full items-center justify-center rounded-full border border-white/20 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/8 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div
        className="fixed inset-x-0 bottom-2 z-40 px-3 md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.25rem)' }}
      >
        <div className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-black/8 bg-white/92 p-2 shadow-[0_20px_45px_rgba(15,23,42,0.14)] backdrop-blur">
          <a
            href="#story"
            className="inline-flex min-h-[3.1rem] flex-1 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f8f2e8,#f1eadf)] px-4 py-3 text-sm font-medium text-[var(--ink-strong)]"
          >
            See how it works
          </a>
          <Link
            href="/signup"
            className="inline-flex min-h-[3.1rem] flex-1 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2d4743,#5f7c73)] px-4 py-3 text-sm font-semibold text-white"
          >
            Get started
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div
      data-hero-stat
      className="rounded-[1.5rem] border border-black/5 bg-white/82 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)] backdrop-blur sm:rounded-[1.75rem] sm:p-5"
    >
      <p className="font-[family:var(--font-display)] text-[2.1rem] tracking-[-0.05em] text-[var(--ink-strong)] sm:text-3xl sm:tracking-[-0.04em]">
        {value}
      </p>
      <p className="mt-2.5 text-sm leading-5 text-[var(--ink-muted)] sm:mt-3 sm:leading-6">
        {label}
      </p>
    </div>
  );
}

function StoryScene({
  title,
  subtitle,
  lines,
  tone,
}: {
  title: string;
  subtitle: string;
  lines: string[];
  tone: string;
}) {
  return (
    <div data-story-scene className="absolute inset-3 rounded-[1.15rem] border border-black/6 bg-white p-3.5 shadow-[0_16px_32px_rgba(15,23,42,0.06)] sm:inset-4 sm:rounded-[1.3rem] sm:p-4">
      <div data-story-line className={`h-2.5 w-18 rounded-full sm:w-20 ${tone}`} />
      <p
        data-story-line
        className="mt-4 text-[11px] uppercase tracking-[0.22em] text-[var(--ink-soft)]"
      >
        {subtitle}
      </p>
      <h3
        data-story-line
        className="mt-2 font-[family:var(--font-display)] text-[2.05rem] leading-[0.96] tracking-[-0.05em] text-[var(--ink-strong)] sm:text-3xl sm:tracking-[-0.04em]"
      >
        {title}
      </h3>
      <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
        {lines.map((line) => (
          <div
            key={line}
            data-story-line
            className="rounded-[0.95rem] border border-black/6 bg-[linear-gradient(180deg,#ffffff,#faf6ef)] px-3.5 py-3 text-sm leading-6 text-[var(--ink-muted)] sm:rounded-[1rem] sm:px-4"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function BenchmarkBar({
  label,
  value,
  sublabel,
  width,
  tone,
}: {
  label: string;
  value: string;
  sublabel: string;
  width: string;
  tone: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-black/5 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:rounded-[1.4rem]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">{label}</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{sublabel}</p>
        </div>
        <p className="font-[family:var(--font-display)] text-[2.15rem] tracking-[-0.05em] text-[var(--ink-strong)] sm:text-3xl sm:tracking-[-0.04em]">
          {value}
        </p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
        <div data-bar-fill data-width={width} className={`h-full rounded-full ${tone}`} />
      </div>
    </div>
  );
}

function ProofTile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/5 bg-[linear-gradient(180deg,#ffffff,#faf6ef)] p-4 sm:rounded-[1.4rem] sm:p-5">
      <h3 className="font-[family:var(--font-display)] text-[1.8rem] leading-[0.98] tracking-[-0.04em] text-[var(--ink-strong)] sm:text-2xl sm:tracking-[-0.03em]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{body}</p>
    </div>
  );
}

function CaptureIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 7.5C8 5.567 9.567 4 11.5 4H12.5C14.433 4 16 5.567 16 7.5V12.5C16 14.433 14.433 16 12.5 16H11.5C9.567 16 8 14.433 8 12.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M6 11.5C6 14.5376 8.46243 17 11.5 17H12.5C15.5376 17 18 14.5376 18 11.5M12 17V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InsightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4C8.68629 4 6 6.68629 6 10C6 12.1478 7.12844 14.0321 8.82436 15.0964C9.18246 15.3211 9.42645 15.6837 9.47941 16.1031L9.75 18.25H14.25L14.5206 16.1031C14.5736 15.6837 14.8175 15.3211 15.1756 15.0964C16.8716 14.0321 18 12.1478 18 10C18 6.68629 15.3137 4 12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 20H14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TrackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7.5C5 6.11929 6.11929 5 7.5 5H16.5C17.8807 5 19 6.11929 19 7.5V16.5C19 17.8807 17.8807 19 16.5 19H7.5C6.11929 19 5 17.8807 5 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 10H16M8 13H13M8 16H11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
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
        d="M11 4H15.5C16.8807 4 18 5.11929 18 6.5V15.5C18 16.8807 16.8807 18 15.5 18H11V4Z"
        fill="currentColor"
        opacity="0.68"
      />
      <path d="M7 8H9M7 11H9M13 8H15M13 11H15" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}
