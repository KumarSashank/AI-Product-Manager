import Link from 'next/link';

import {
  benchmarkHeadline,
  researchArtifacts,
  researchContributions,
  researchLayers,
} from '@/lib/research';

function passRate(passed: number, failed: number): number {
  const total = passed + failed;
  return total === 0 ? 0 : Math.round((passed / total) * 100);
}

export default function ResearchPage() {
  const currentPassRate = passRate(
    benchmarkHeadline.currentSystem.passed,
    benchmarkHeadline.currentSystem.failed
  );
  const baselinePassRate = passRate(
    benchmarkHeadline.transcriptOnly.passed,
    benchmarkHeadline.transcriptOnly.failed
  );

  return (
    <main className="min-h-screen bg-[var(--surface-base)] text-[var(--ink-strong)]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(29,78,216,0.12),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(8,145,178,0.12),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#fffdf8_50%,#ffffff_100%)]" />

      <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink-strong)]"
          >
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(13,77,170,0.18)] transition hover:-translate-y-0.5"
            >
              Start with a transcript
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-6 pb-14 pt-16 lg:px-10 lg:pb-20 lg:pt-20">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.28em] text-[#1d4ed8]">Research overview</p>
          <h1 className="mt-4 font-[family:var(--font-display)] text-5xl tracking-[-0.045em] text-[var(--ink-strong)] sm:text-6xl">
            This product is evaluated as execution memory, not just summary quality.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--ink-muted)]">
            The research thesis is simple: meeting intelligence becomes more useful when it
            remembers prior commitments, tracks accountability over time, and is benchmarked
            longitudinally against a transcript-only baseline.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.8rem] border border-black/5 bg-white/90 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Scenario</p>
            <p className="mt-3 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
              {benchmarkHeadline.meetings} meetings
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
              {benchmarkHeadline.scenario}
            </p>
          </div>
          <div className="rounded-[1.8rem] border border-[#1d4ed8]/12 bg-[linear-gradient(180deg,#ffffff,#eef6ff)] p-6 shadow-[0_24px_64px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[#1d4ed8]">Current system</p>
            <p className="mt-3 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
              {benchmarkHeadline.currentSystem.passed} / {benchmarkHeadline.currentSystem.failed}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
              Passed / failed checks with project memory enabled. Approximate pass rate:{' '}
              {currentPassRate}%.
            </p>
          </div>
          <div className="rounded-[1.8rem] border border-black/5 bg-white/90 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              Transcript-only baseline
            </p>
            <p className="mt-3 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">
              {benchmarkHeadline.transcriptOnly.passed} / {benchmarkHeadline.transcriptOnly.failed}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
              Same scenario, but without prior project memory. Approximate pass rate:{' '}
              {baselinePassRate}%.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-7 shadow-[0_24px_64px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.28em] text-[#0891b2]">
              Research contribution
            </p>
            <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] text-[var(--ink-strong)]">
              The novelty is in continuity, accountability, and defensible evaluation.
            </h2>
            <ul className="mt-8 space-y-4 text-base leading-7 text-[var(--ink-muted)]">
              {researchContributions.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#1d4ed8]/30" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-7 shadow-[0_24px_64px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.28em] text-[#c2410c]">
              Why the baseline matters
            </p>
            <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] text-[var(--ink-strong)]">
              Better notes are not enough.
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
              A transcript-only system can produce readable outputs, but it cannot reliably decide
              what stayed open, what was resolved later, which deadlines silently slipped, or when
              the project is genuinely ready. That is the difference this project is trying to
              measure.
            </p>
            <div className="mt-7 rounded-[1.4rem] border border-black/6 bg-white/90 p-5">
              <p className="text-sm font-medium text-[var(--ink-strong)]">Core claim</p>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">
                Longitudinal project memory should outperform single-meeting reasoning when the task
                is execution support, not note generation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.28em] text-[#1d4ed8]">Evaluation layers</p>
          <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] text-[var(--ink-strong)]">
            The system is scored on more than writing quality.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--ink-muted)]">
            The rubric separates extraction quality, state-tracking quality, and PM usefulness so
            the research story stays grounded in measurable behavior.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {researchLayers.map((layer) => (
            <article
              key={layer.title}
              className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.06)]"
            >
              <h3 className="font-[family:var(--font-display)] text-3xl tracking-[-0.03em] text-[var(--ink-strong)]">
                {layer.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--ink-muted)]">
                {layer.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ink-muted)]">
                {layer.metrics.map((metric) => (
                  <li key={metric} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#0891b2]/30" />
                    <span>{metric}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        <div className="rounded-[2rem] border border-black/5 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-7 shadow-[0_24px_64px_rgba(15,23,42,0.06)]">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-[#0891b2]">Artifacts</p>
            <h2 className="mt-4 font-[family:var(--font-display)] text-4xl tracking-[-0.04em] text-[var(--ink-strong)]">
              Benchmark code, rubric, and dataset are all inspectable.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--ink-muted)]">
              The research claim should be inspectable by anyone reviewing the project, so the repo
              includes the scenario files, evaluation rubric, and benchmark runner instead of hiding
              them behind screenshots.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {researchArtifacts.map((artifact) => (
              <a
                key={artifact.label}
                href={artifact.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-[1.5rem] border border-black/6 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(15,23,42,0.08)]"
              >
                <p className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
                  {artifact.label}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                  {artifact.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
