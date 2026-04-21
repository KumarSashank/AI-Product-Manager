export const REPO_URL = 'https://github.com/KumarSashank/AI-Product-Manager';

export const benchmarkHeadline = {
  scenario: 'Onboarding Growth Initiative - 5 Week Accountability Regression',
  meetings: 5,
  currentSystem: { passed: 37, failed: 1 },
  transcriptOnly: { passed: 34, failed: 4 },
};

export const benchmarkSuiteOverview = {
  scenarioCount: 2,
  comparedSystems: 2,
  scenarios: [
    'Onboarding Growth Initiative - 5 Week Accountability Regression',
    'Release Recovery Cycle - 4 Week Reliability Regression',
  ],
};

export const benchmarkSuiteResult = {
  currentSystem: { passed: 65, failed: 7 },
  transcriptOnly: { passed: 57, failed: 15 },
  scenarioWins: 2,
};

export const benchmarkScenarioCatalog = [
  {
    scenarioId: 'onboarding_growth_initiative_v1',
    displayName: 'Onboarding Growth Initiative',
    meetingCount: 5,
    focus:
      'Carry-forward accountability, launch readiness, unresolved questions, and whether a project-memory system can reconcile shifting execution state over time.',
    transcriptFolderHref: `${REPO_URL}/tree/main/benchmark/scenarios/onboarding_growth_initiative/transcripts`,
  },
  {
    scenarioId: 'release_recovery_cycle_v1',
    displayName: 'Release Recovery Cycle',
    meetingCount: 4,
    focus:
      'Incident recovery memory, rollback decision closure, launch gating, vendor escalation tracking, and transition from firefighting into release readiness.',
    transcriptFolderHref: `${REPO_URL}/tree/main/benchmark/scenarios/release_recovery_cycle/transcripts`,
  },
];

export const benchmarkAblations = [
  {
    id: 'current_system',
    label: 'Stateful execution memory',
    status: 'live',
    description:
      'Uses project memory, carry-forward reconciliation, evidence metadata, and accountability-aware extraction across recurring meetings.',
  },
  {
    id: 'transcript_only',
    label: 'Transcript-only baseline',
    status: 'live',
    description:
      'Reasoning is limited to the current meeting transcript and meeting-local metadata, with no prior project state or carry-forward context.',
  },
  {
    id: 'next_ablation',
    label: 'Next ablations to add',
    status: 'planned',
    description:
      'Planned follow-ups include memory-without-evidence, extraction-only without reconciliation, and lifecycle-transition scoring against gold labels.',
  },
];

export const researchLayers = [
  {
    title: 'Extraction quality',
    description:
      'Measures whether the system identifies the right actions, owners, deadlines, questions, and risks from a meeting transcript.',
    metrics: ['item extraction F1', 'owner attribution accuracy', 'deadline accuracy'],
  },
  {
    title: 'State-tracking quality',
    description:
      'Measures whether the system carries work forward correctly across recurring meetings instead of treating every meeting in isolation.',
    metrics: [
      'lifecycle transition accuracy',
      'false-closure rate',
      'unresolved-question carry-forward accuracy',
    ],
  },
  {
    title: 'PM usefulness quality',
    description:
      'Measures whether the output is actually operational for product and engineering follow-up, not just readable as notes.',
    metrics: ['readiness label accuracy', 'evidence grounding coverage', 'human PM scoring'],
  },
];

export const researchContributions = [
  'Stateful project memory instead of transcript-only summarization',
  'Accountability-aware extraction that tracks owners, deadlines, and silent blockers',
  'Longitudinal benchmark harness with a transcript-only baseline for ablation',
  'Evidence trace surfaces that tie extracted items back to transcript spans and context',
];

export const researchArtifacts = [
  {
    label: 'Benchmark harness',
    href: `${REPO_URL}/tree/main/benchmark`,
    description:
      'Scenario runner, schemas, reports, and dataset structure for longitudinal evaluation.',
  },
  {
    label: 'Evaluation rubric',
    href: `${REPO_URL}/blob/main/docs/EVAL_RUBRIC.md`,
    description:
      'Research framing, automatic metrics, human scoring, and recommended acceptance thresholds.',
  },
  {
    label: 'Dataset transcripts',
    href: `${REPO_URL}/tree/main/benchmark/scenarios/onboarding_growth_initiative/transcripts`,
    description: 'Chronological transcript files used for the accountability regression scenario.',
  },
  {
    label: 'Benchmark suite',
    href: `${REPO_URL}/blob/main/benchmark/README.md`,
    description:
      'How to run the multi-scenario suite and compare the stateful system against the transcript-only baseline.',
  },
  {
    label: 'Latest suite reports',
    href: `${REPO_URL}/tree/main/benchmark/reports/suites`,
    description:
      'Committed JSON and Markdown outputs from the latest benchmark suite run, including aggregate totals and per-scenario breakdowns.',
  },
  {
    label: 'Suite runner',
    href: `${REPO_URL}/blob/main/benchmark/run-benchmark-suite.ts`,
    description:
      'The orchestration script that executes every registered scenario and writes aggregate JSON plus Markdown research artifacts.',
  },
];
