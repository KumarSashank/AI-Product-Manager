export const REPO_URL = 'https://github.com/KumarSashank/AI-Product-Manager';

export const benchmarkHeadline = {
  scenario: 'Onboarding Growth Initiative - 5 Week Accountability Regression',
  meetings: 5,
  currentSystem: { passed: 38, failed: 0 },
  transcriptOnly: { passed: 32, failed: 6 },
};

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
];
