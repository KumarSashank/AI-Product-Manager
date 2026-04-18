/* eslint-disable no-console */

import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type BenchmarkSystemId = 'current_system' | 'transcript_only';
type BenchmarkSystemSelection = BenchmarkSystemId | 'all';

interface BenchmarkSystemSummary {
  systemId: BenchmarkSystemId;
  systemLabel: string;
  checksPassed: number;
  checksFailed: number;
}

interface ChildRunSummary {
  scenarioId: string;
  requestedSystems: BenchmarkSystemId[];
  systems: BenchmarkSystemSummary[];
  bestSystemId?: BenchmarkSystemId | undefined;
  reportPath: string;
  markdownPath?: string | undefined;
}

interface BenchmarkReport {
  scenario: {
    scenarioId: string;
    displayName: string;
  };
  systems: Array<{
    systemId: BenchmarkSystemId;
    systemLabel: string;
    summary: {
      checksPassed: number;
      checksFailed: number;
    };
  }>;
  comparison?: {
    ranking: Array<{
      systemId: BenchmarkSystemId;
      systemLabel: string;
      checksPassed: number;
      checksFailed: number;
      passRate: number;
    }>;
  } | null;
}

interface SuiteScenarioResult {
  scenarioId: string;
  displayName: string;
  bestSystemId?: BenchmarkSystemId | undefined;
  systems: BenchmarkSystemSummary[];
  reportPath: string;
  markdownPath?: string | undefined;
}

interface SuiteReport {
  run: {
    startedAt: string;
    finishedAt: string;
    apiBaseUrl: string;
    requestedSystems: BenchmarkSystemId[];
    scenarioCount: number;
    suiteReportPath: string;
    suiteMarkdownPath: string;
  };
  summary: {
    bestSystemId?: BenchmarkSystemId | undefined;
    totals: BenchmarkSystemSummary[];
  };
  scenarios: SuiteScenarioResult[];
}

const repoRoot = process.cwd().endsWith(path.join('packages', 'ai-backend'))
  ? path.resolve(process.cwd(), '..', '..')
  : process.cwd();

const DEFAULT_API_BASE_URL = process.env.BENCHMARK_API_BASE_URL ?? 'http://127.0.0.1:3002/api/v1';
const SCENARIOS_ROOT = path.join(repoRoot, 'benchmark', 'scenarios');
const SUITE_REPORT_DIR = path.join(repoRoot, 'benchmark', 'reports', 'suites');

function parseSystemSelection(value: string): BenchmarkSystemSelection {
  if (value === 'all' || value === 'current_system' || value === 'transcript_only') {
    return value;
  }

  throw new Error(`Invalid --system value: ${value}`);
}

function parseArgs(argv: string[]) {
  const args = [...argv];
  let apiBaseUrl = DEFAULT_API_BASE_URL;
  let system = 'all' as BenchmarkSystemSelection;
  const scenarioPaths: string[] = [];

  while (args.length > 0) {
    const current = args.shift();
    if (!current) continue;
    if (current === '--') continue;

    if (current === '--base-url') {
      const value = args.shift();
      if (!value) throw new Error('Missing value for --base-url');
      apiBaseUrl = value;
      continue;
    }

    if (current === '--system') {
      const value = args.shift();
      if (!value) throw new Error('Missing value for --system');
      system = parseSystemSelection(value);
      continue;
    }

    if (!current.startsWith('--')) {
      scenarioPaths.push(path.resolve(repoRoot, current));
      continue;
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  return { apiBaseUrl, system, scenarioPaths };
}

async function discoverScenarioPaths(): Promise<string[]> {
  const directories = await readdir(SCENARIOS_ROOT, { withFileTypes: true });

  return directories
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(SCENARIOS_ROOT, entry.name, 'scenario.json'))
    .sort((left, right) => left.localeCompare(right));
}

function extractJsonPayload(raw: string): ChildRunSummary {
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(`Could not parse benchmark output: ${raw}`);
  }

  return JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as ChildRunSummary;
}

async function runScenario(args: {
  scenarioPath: string;
  apiBaseUrl: string;
  system: BenchmarkSystemSelection;
}): Promise<SuiteScenarioResult> {
  const commandArgs = [
    '--filter',
    '@meeting-ai/ai-backend',
    'exec',
    'tsx',
    '../../benchmark/run-longitudinal-eval.ts',
    '--system',
    args.system,
    '--base-url',
    args.apiBaseUrl,
    args.scenarioPath,
  ];

  const output = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn('pnpm', commandArgs, {
      cwd: repoRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || stdout || `Scenario run failed with code ${code}`));
        return;
      }

      resolve({ stdout, stderr });
    });
  });

  const childSummary = extractJsonPayload(output.stdout);
  const reportRaw = await readFile(childSummary.reportPath, 'utf8');
  const report = JSON.parse(reportRaw) as BenchmarkReport;

  return {
    scenarioId: report.scenario.scenarioId,
    displayName: report.scenario.displayName,
    bestSystemId: childSummary.bestSystemId,
    systems: childSummary.systems,
    reportPath: childSummary.reportPath,
    markdownPath: childSummary.markdownPath,
  };
}

function buildTotals(
  scenarios: SuiteScenarioResult[],
  requestedSystems: BenchmarkSystemId[]
): BenchmarkSystemSummary[] {
  const totals = new Map<BenchmarkSystemId, BenchmarkSystemSummary>();

  for (const systemId of requestedSystems) {
    totals.set(systemId, {
      systemId,
      systemLabel: systemId === 'current_system' ? 'Current system' : 'Transcript-only baseline',
      checksPassed: 0,
      checksFailed: 0,
    });
  }

  for (const scenario of scenarios) {
    for (const system of scenario.systems) {
      const current = totals.get(system.systemId);
      if (!current) continue;
      current.checksPassed += system.checksPassed;
      current.checksFailed += system.checksFailed;
      current.systemLabel = system.systemLabel;
    }
  }

  return Array.from(totals.values()).sort((left, right) => {
    if (right.checksPassed !== left.checksPassed) return right.checksPassed - left.checksPassed;
    return left.checksFailed - right.checksFailed;
  });
}

function formatPercent(passed: number, failed: number): string {
  const total = passed + failed;
  return total === 0 ? '0%' : `${Math.round((passed / total) * 100)}%`;
}

function renderSuiteMarkdown(report: SuiteReport): string {
  const lines: string[] = [];

  lines.push('# Benchmark Suite Summary');
  lines.push('');
  lines.push('## Run');
  lines.push('');
  lines.push(`- Started: ${report.run.startedAt}`);
  lines.push(`- Finished: ${report.run.finishedAt}`);
  lines.push(`- API base URL: ${report.run.apiBaseUrl}`);
  lines.push(`- Scenario count: ${report.run.scenarioCount}`);
  lines.push(`- Requested systems: ${report.run.requestedSystems.join(', ')}`);
  if (report.summary.bestSystemId) {
    lines.push(`- Best aggregate system: ${report.summary.bestSystemId}`);
  }
  lines.push('');

  lines.push('## Aggregate totals');
  lines.push('');
  lines.push('| System | Passed | Failed | Pass Rate |');
  lines.push('| --- | ---: | ---: | ---: |');
  for (const system of report.summary.totals) {
    lines.push(
      `| ${system.systemLabel} | ${system.checksPassed} | ${system.checksFailed} | ${formatPercent(system.checksPassed, system.checksFailed)} |`
    );
  }
  lines.push('');

  lines.push('## Scenario breakdown');
  lines.push('');
  lines.push('| Scenario | Best system | Current system | Transcript-only baseline |');
  lines.push('| --- | --- | ---: | ---: |');
  for (const scenario of report.scenarios) {
    const currentSystem = scenario.systems.find((system) => system.systemId === 'current_system');
    const transcriptOnly = scenario.systems.find((system) => system.systemId === 'transcript_only');

    lines.push(
      `| ${scenario.displayName} | ${scenario.bestSystemId ?? 'n/a'} | ${currentSystem ? `${currentSystem.checksPassed} / ${currentSystem.checksFailed}` : 'n/a'} | ${transcriptOnly ? `${transcriptOnly.checksPassed} / ${transcriptOnly.checksFailed}` : 'n/a'} |`
    );
  }
  lines.push('');

  lines.push('## Generated reports');
  lines.push('');
  for (const scenario of report.scenarios) {
    lines.push(`### ${scenario.displayName}`);
    lines.push('');
    lines.push(`- JSON report: ${scenario.reportPath}`);
    if (scenario.markdownPath) {
      lines.push(`- Markdown summary: ${scenario.markdownPath}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

async function main() {
  const startedAt = new Date();
  const { apiBaseUrl, system, scenarioPaths } = parseArgs(process.argv.slice(2));
  const resolvedScenarioPaths =
    scenarioPaths.length > 0 ? scenarioPaths : await discoverScenarioPaths();

  if (resolvedScenarioPaths.length === 0) {
    throw new Error('No benchmark scenarios were found.');
  }

  const requestedSystems: BenchmarkSystemId[] =
    system === 'all' ? ['current_system', 'transcript_only'] : [system];

  const results: SuiteScenarioResult[] = [];
  for (const scenarioPath of resolvedScenarioPaths) {
    results.push(
      await runScenario({
        scenarioPath,
        apiBaseUrl,
        system,
      })
    );
  }

  const totals = buildTotals(results, requestedSystems);
  const suiteStartedAt = startedAt.toISOString().replace(/[:.]/g, '-');

  await mkdir(SUITE_REPORT_DIR, { recursive: true });
  const suiteReportPath = path.join(SUITE_REPORT_DIR, `${suiteStartedAt}-benchmark-suite.json`);
  const suiteMarkdownPath = path.join(SUITE_REPORT_DIR, `${suiteStartedAt}-benchmark-suite.md`);

  const suiteReport: SuiteReport = {
    run: {
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      apiBaseUrl,
      requestedSystems,
      scenarioCount: results.length,
      suiteReportPath,
      suiteMarkdownPath,
    },
    summary: {
      bestSystemId: totals[0]?.systemId,
      totals,
    },
    scenarios: results,
  };

  await writeFile(suiteReportPath, JSON.stringify(suiteReport, null, 2), 'utf8');
  await writeFile(suiteMarkdownPath, renderSuiteMarkdown(suiteReport), 'utf8');

  console.log(
    JSON.stringify(
      {
        suiteReportPath,
        suiteMarkdownPath,
        scenarioCount: results.length,
        bestSystemId: suiteReport.summary.bestSystemId,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
