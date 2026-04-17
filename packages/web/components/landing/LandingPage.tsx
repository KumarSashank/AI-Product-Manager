'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Feature = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  accent: string;
  icon: React.ReactNode;
};

type Method = {
  label: string;
  status: string;
  description: string;
  notes: string[];
  accent: string;
};

const productHighlights = [
  { value: '38 / 0', label: 'Benchmark checks passed with project memory enabled' },
  { value: '32 / 6', label: 'Transcript-only baseline result on the same scenario' },
  { value: '5 meetings', label: 'Longitudinal dataset used to validate carry-forward reasoning' },
];

const features: Feature[] = [
  {
    eyebrow: 'Persistent context',
    title: 'A meeting system that remembers what the team already committed to.',
    description:
      'Every meeting can pull forward prior decisions, open questions, deadlines, and unresolved blockers before generating the next Minutes of Meeting.',
    points: [
      'Carries open action items across weekly reviews',
      'Keeps unresolved questions visible until explicitly answered',
      'Links new decisions back to prior meeting context',
    ],
    accent: 'from-[#1d4ed8] to-[#60a5fa]',
    icon: <MemoryIcon />,
  },
  {
    eyebrow: 'Accountability',
    title: 'Track owners, deadlines, and missing updates without manual follow-up.',
    description:
      'The system extracts structured items, reasons over due dates, and surfaces accountability gaps that usually disappear in ordinary summaries.',
    points: [
      'Highlights overdue work and silent deadlines',
      'Stores individual or team ownership metadata',
      'Supports item status updates in a task workspace',
    ],
    accent: 'from-[#0891b2] to-[#5eead4]',
    icon: <AccountabilityIcon />,
  },
  {
    eyebrow: 'Decision quality',
    title: 'Generate PM-grade MoMs instead of generic meeting recap.',
    description:
      'Raw transcript evidence, stored project context, and structured extraction are combined before the final MoM is written.',
    points: [
      'Preserves launch blockers and readiness concerns',
      'Separates resolved work from still-open risks',
      'Produces a cleaner handoff into execution',
    ],
    accent: 'from-[#c2410c] to-[#fdba74]',
    icon: <DecisionIcon />,
  },
];

const methods: Method[] = [
  {
    label: 'Transcript upload',
    status: 'Recommended',
    description:
      'Best path for dependable evaluation and repeatable benchmark runs. Upload a transcript, enrich it with project memory, and generate the MoM.',
    notes: ['Most reliable workflow today', 'Ideal for demo runs and benchmark scenarios'],
    accent: 'border-[#1d4ed8]/20 bg-[#eff6ff]',
  },
  {
    label: 'Chrome extension',
    status: 'In progress',
    description:
      'Audio capture is working and the transcript pipeline is improving. Multi-speaker attribution is still being tuned for Google Meet caption behavior.',
    notes: ['Audio recording supported', 'Speaker-separated transcript extraction still improving'],
    accent: 'border-[#0891b2]/20 bg-[#ecfeff]',
  },
  {
    label: 'Meeting bot',
    status: 'Preview',
    description:
      'Useful for experimentation, but join reliability still depends on 2FA, waiting rooms, and workspace permissions.',
    notes: ['Can be affected by auth prompts', 'Best treated as a development-path capture method'],
    accent: 'border-[#c2410c]/20 bg-[#fff7ed]',
  },
];

export default function LandingPage() {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTimeline
        .from('[data-hero-badge]', { y: 24, opacity: 0, duration: 0.6 })
        .from('[data-hero-title]', { y: 38, opacity: 0, duration: 0.8 }, '-=0.3')
        .from('[data-hero-copy]', { y: 26, opacity: 0, duration: 0.7 }, '-=0.45')
        .from('[data-hero-actions]', { y: 20, opacity: 0, duration: 0.55 }, '-=0.35')
        .from('[data-hero-stats]', { y: 18, opacity: 0, stagger: 0.12, duration: 0.45 }, '-=0.25')
        .from(
          '[data-hero-illustration] > *',
          { y: 34, opacity: 0, stagger: 0.14, duration: 0.7, ease: 'power3.out' },
          '-=0.75'
        );

      gsap.to('[data-float-card="left"]', {
        y: -14,
        rotate: -2,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('[data-float-card="right"]', {
        y: 18,
        rotate: 2,
        duration: 3.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 42,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 82%',
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
            duration: 1.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 88%',
            },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={rootRef}
      className="min-h-screen overflow-x-hidden bg-[var(--surface-base)] text-[var(--ink-strong)]"
    >
      <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(29,78,216,0.12),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(8,145,178,0.14),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#fffdf8_44%,#ffffff_100%)]" />
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/78 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] text-white shadow-[0_16px_30px_rgba(29,78,216,0.18)]">
              <LogoGlyph />
            </div>
            <div>
              <p className="font-[family:var(--font-display)] text-xl leading-none tracking-[-0.02em]">
                AI Product Manager
              </p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Meeting intelligence with execution memory
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[var(--ink-muted)] md:flex">
            <a href="#features" className="transition hover:text-[var(--ink-strong)]">
              Product
            </a>
            <a href="#proof" className="transition hover:text-[var(--ink-strong)]">
              Validation
            </a>
            <a href="#capture" className="transition hover:text-[var(--ink-strong)]">
              Capture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="hidden rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-black/15 hover:bg-black/5 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(13,77,170,0.18)] transition hover:-translate-y-0.5"
            >
              Start with a transcript
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-16 px-6 pb-24 pt-16 lg:grid-cols-[1.06fr_0.94fr] lg:px-10 lg:pb-32 lg:pt-24">
        <div className="max-w-3xl">
          <div
            data-hero-badge
            className="inline-flex items-center gap-3 rounded-full border border-[#1d4ed8]/12 bg-white/80 px-4 py-2 text-sm text-[var(--ink-muted)] shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
            Stateful product meeting intelligence for recurring delivery reviews
          </div>

          <h1
            data-hero-title
            className="mt-8 max-w-4xl font-[family:var(--font-display)] text-5xl leading-[1.02] tracking-[-0.045em] text-[var(--ink-strong)] sm:text-6xl lg:text-7xl"
          >
            Minutes of Meeting that remember what your team already promised.
          </h1>

          <p
            data-hero-copy
            className="mt-8 max-w-2xl text-lg leading-8 text-[var(--ink-muted)] sm:text-xl"
          >
            AI Product Manager turns transcripts into project memory, owner-aware action items, and
            PM-grade meeting notes that keep unresolved questions, deadlines, and launch blockers
            visible across meetings.
          </p>

          <div data-hero-actions className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_30px_rgba(13,77,170,0.18)] transition hover:-translate-y-0.5"
            >
              Launch the workspace
            </Link>
            <a
              href="#proof"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-base font-medium text-[var(--ink-strong)] transition hover:border-black/15 hover:bg-black/5"
            >
              See the benchmark evidence
            </a>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {productHighlights.map((item) => (
              <div
                key={item.label}
                data-hero-stats
                className="rounded-[1.75rem] border border-black/5 bg-white/80 p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] backdrop-blur"
              >
                <p className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
                  {item.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            data-hero-illustration
            className="relative mx-auto max-w-[38rem] rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,245,249,0.92))] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.1)]"
          >
            <div className="rounded-[1.6rem] border border-[#dbeafe] bg-[linear-gradient(180deg,#ffffff,#eef6ff)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#1d4ed8]">
                    Meeting Intelligence Loop
                  </p>
                  <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
                    Transcript to accountability
                  </h2>
                </div>
                <div className="rounded-full border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                  Live product state
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
                <IllustrationCard
                  title="Transcript"
                  subtitle="Current meeting evidence"
                  accent="bg-[#dbeafe]"
                  lines={['Speaker-aware notes', 'Audio available', 'Structured transcript upload']}
                />
                <FlowConnector />
                <IllustrationCard
                  title="Project memory"
                  subtitle="Cross-meeting context"
                  accent="bg-[#ccfbf1]"
                  lines={['Open items', 'Resolved decisions', 'Deadline carry-forward']}
                />
                <FlowConnector />
                <IllustrationCard
                  title="PM MoM"
                  subtitle="Actionable output"
                  accent="bg-[#ffedd5]"
                  lines={['Owner-aware actions', 'Launch risks', 'Decision-ready summary']}
                />
              </div>

              <div className="relative mt-8 min-h-[14rem] overflow-hidden rounded-[1.6rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.16),transparent_38%),linear-gradient(180deg,#f8fbff,#ffffff)] p-5">
                <div
                  data-float-card="left"
                  className="absolute left-5 top-6 w-[13rem] rounded-[1.4rem] border border-black/5 bg-white/90 p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)]"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8]">
                    Carry-forward issue
                  </p>
                  <p className="mt-3 text-sm font-medium text-[var(--ink-strong)]">
                    Launch comms still pending while duplicate-account fix is under review.
                  </p>
                </div>

                <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#bfdbfe] bg-[radial-gradient(circle,rgba(29,78,216,0.12),rgba(29,78,216,0.03),transparent_72%)]" />

                <div
                  data-float-card="right"
                  className="absolute bottom-6 right-5 w-[14.5rem] rounded-[1.4rem] border border-black/5 bg-white/90 p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)]"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-[#0891b2]">PM output</p>
                  <p className="mt-3 text-sm font-medium text-[var(--ink-strong)]">
                    Ready for beta review, but final launch communication must close before go-live.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" data-reveal className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-[#1d4ed8]">
            Why it feels different
          </p>
          <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] text-[var(--ink-strong)] sm:text-5xl">
            Built for recurring product reviews, not one-off meeting summaries.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--ink-muted)]">
            The product is designed around the messy reality of weekly delivery meetings: people
            forget to update status, open questions linger, and launch readiness changes over time.
          </p>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              data-reveal
              className="group rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_24px_64px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.09)]"
            >
              <div
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-[0_14px_28px_rgba(15,23,42,0.12)]`}
              >
                {feature.icon}
              </div>
              <p className="mt-6 text-sm uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                {feature.eyebrow}
              </p>
              <h3 className="mt-3 font-[family:var(--font-display)] text-3xl leading-tight tracking-[-0.035em] text-[var(--ink-strong)]">
                {feature.title}
              </h3>
              <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
                {feature.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ink-muted)]">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--ink-strong)]/15" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="proof" className="mx-auto mt-8 w-full max-w-7xl px-6 py-16 lg:px-10">
        <div
          data-reveal
          className="overflow-hidden rounded-[2.2rem] border border-black/5 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] shadow-[0_28px_90px_rgba(15,23,42,0.08)]"
        >
          <div className="grid gap-10 px-7 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-10">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#0891b2]">Validation proof</p>
              <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] text-[var(--ink-strong)]">
                The stateful system outperforms transcript-only meeting analysis.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--ink-muted)]">
                A built-in longitudinal benchmark processes a linked sequence of weekly product
                meetings and checks whether the system preserves ownership, deadlines, question
                closure, and final project state.
              </p>

              <div className="mt-8 space-y-5">
                <BenchmarkBar
                  label="Current system"
                  value="38 / 0"
                  sublabel="Passed / failed checks"
                  width="100%"
                  tone="bg-[linear-gradient(90deg,#1d4ed8,#0891b2)]"
                />
                <BenchmarkBar
                  label="Transcript-only baseline"
                  value="32 / 6"
                  sublabel="Passed / failed checks"
                  width="84%"
                  tone="bg-[linear-gradient(90deg,#94a3b8,#64748b)]"
                />
              </div>
            </div>

            <div className="grid gap-5 rounded-[1.8rem] border border-black/5 bg-white/90 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <ProofCard
                  title="Continuity"
                  body="Keeps launch comms, compliance, and carry-forward decisions visible across weekly meetings."
                />
                <ProofCard
                  title="Accountability"
                  body="Surfaces open owners, overdue items, and unresolved product questions instead of letting them disappear."
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <ProofCard
                  title="Decision memory"
                  body="Resolves prior questions when later meetings provide explicit decisions, preventing false resurfacing."
                />
                <ProofCard
                  title="Readiness judgment"
                  body="Distinguishes completed work from remaining launch blockers before the final MoM is written."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div data-reveal>
            <p className="text-sm uppercase tracking-[0.28em] text-[#c2410c]">How the flow works</p>
            <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] text-[var(--ink-strong)]">
              Start from a transcript, end with a clearer execution picture.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--ink-muted)]">
              The workflow is intentionally structured so the MoM is the last step, not the first.
              That makes the final note much more reliable for product and engineering reviews.
            </p>
          </div>

          <div className="grid gap-5">
            {[
              [
                'Capture meeting evidence',
                'Upload a transcript or use a capture method, then store the raw meeting evidence before any summary is generated.',
              ],
              [
                'Extract structured state',
                'Identify action items, decisions, open questions, risks, deadlines, and owner metadata from the current meeting.',
              ],
              [
                'Reconcile with project memory',
                'Query prior meetings and open items, then determine what is resolved, what slipped, and what remains risky.',
              ],
              [
                'Generate the MoM',
                'Combine transcript evidence with project context to produce a PM-style summary and accountable next steps.',
              ],
            ].map(([title, copy], index) => (
              <div
                key={title}
                data-reveal
                className="grid gap-5 rounded-[1.6rem] border border-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:grid-cols-[auto_1fr]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] font-[family:var(--font-display)] text-2xl text-white shadow-[0_16px_30px_rgba(13,77,170,0.16)]">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-[var(--ink-muted)]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="capture" className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10">
        <div data-reveal className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-[#1d4ed8]">Capture methods</p>
          <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] text-[var(--ink-strong)]">
            A clear capture surface with honest product states.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--ink-muted)]">
            The public product surface should tell users what is stable today and what is still
            evolving, especially for live meeting capture workflows.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {methods.map((method) => (
            <article
              key={method.label}
              data-reveal
              className={`rounded-[1.8rem] border p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${method.accent}`}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-[family:var(--font-display)] text-3xl tracking-[-0.03em] text-[var(--ink-strong)]">
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
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-black/15" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-10 lg:px-10 lg:pb-28">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[2.3rem] border border-black/5 bg-[linear-gradient(135deg,#1e293b,#0f172a)] px-8 py-10 text-white shadow-[0_28px_90px_rgba(15,23,42,0.16)] lg:px-10 lg:py-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.15),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.18),transparent_36%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.28em] text-[#93c5fd]">Deployable now</p>
              <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] sm:text-5xl">
                Ship a public homepage that explains the product before the user ever sees the
                dashboard.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                This landing page gives the project a proper SaaS front door while keeping the app,
                benchmark, and capture workflows reachable from one surface.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition hover:-translate-y-0.5"
              >
                Create an account
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3.5 text-base font-medium text-white transition hover:bg-white/8"
              >
                Open the app
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function IllustrationCard({
  title,
  subtitle,
  lines,
  accent,
}: {
  title: string;
  subtitle: string;
  lines: string[];
  accent: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-black/5 bg-white/88 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
      <div className={`h-2 w-full rounded-full ${accent}`} />
      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">{subtitle}</p>
      <h3 className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="hidden items-center justify-center lg:flex">
      <div className="h-px w-10 bg-[linear-gradient(90deg,rgba(148,163,184,0.15),rgba(29,78,216,0.5),rgba(148,163,184,0.15))]" />
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
    <div className="rounded-[1.4rem] border border-black/5 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">{label}</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{sublabel}</p>
        </div>
        <p className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
          {value}
        </p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
        <div data-bar-fill data-width={width} className={`h-full rounded-full ${tone}`} />
      </div>
    </div>
  );
}

function ProofCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-black/5 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5">
      <h3 className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{body}</p>
    </div>
  );
}

function MemoryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7.5C5 6.11929 6.11929 5 7.5 5H16.5C17.8807 5 19 6.11929 19 7.5V16.5C19 17.8807 17.8807 19 16.5 19H7.5C6.11929 19 5 17.8807 5 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 10H16M8 13H16M8 16H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AccountabilityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4L19 7V11.5C19 15.9183 16.1346 19.9722 12 21C7.86543 19.9722 5 15.9183 5 11.5V7L12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M9.25 12.25L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DecisionIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 6H16.5C17.8807 6 19 7.11929 19 8.5V15.5C19 16.8807 17.8807 18 16.5 18H12L8.5 20V18H7.5C6.11929 18 5 16.8807 5 15.5V8.5C5 7.11929 6.11929 6 7.5 6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 10H15M9 13H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
