import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

type BenchmarkSystemId = 'current_system' | 'transcript_only';

interface SuiteSystemSummary {
  systemId: BenchmarkSystemId;
  systemLabel: string;
  checksPassed: number;
  checksFailed: number;
}

interface SuiteScenarioResult {
  scenarioId: string;
  displayName: string;
  bestSystemId?: BenchmarkSystemId | undefined;
  systems: SuiteSystemSummary[];
}

interface SuiteReport {
  run: {
    startedAt: string;
    finishedAt: string;
    scenarioCount: number;
  };
  summary: {
    bestSystemId?: BenchmarkSystemId | undefined;
    totals: SuiteSystemSummary[];
  };
  scenarios: SuiteScenarioResult[];
}

function getRepoRoot(): string {
  const cwd = process.cwd();
  return cwd.endsWith(path.join('packages', 'web')) ? path.resolve(cwd, '..', '..') : cwd;
}

function withPassRate<T extends { checksPassed: number; checksFailed: number }>(item: T) {
  const total = item.checksPassed + item.checksFailed;

  return {
    ...item,
    passRate: total === 0 ? 0 : Math.round((item.checksPassed / total) * 100),
  };
}

export async function getLatestSuiteArtifact() {
  const suiteDir = path.join(getRepoRoot(), 'benchmark', 'reports', 'suites');

  let files: string[] = [];
  try {
    files = (await readdir(suiteDir))
      .filter((file) => file.endsWith('.json'))
      .sort((left, right) => right.localeCompare(left));
  } catch {
    return null;
  }

  const latestFile = files[0];
  if (!latestFile) {
    return null;
  }

  const reportPath = path.join(suiteDir, latestFile);
  const raw = await readFile(reportPath, 'utf8');
  const parsed = JSON.parse(raw) as SuiteReport;

  return {
    generatedAt: parsed.run.finishedAt,
    scenarioCount: parsed.run.scenarioCount,
    bestSystemId: parsed.summary.bestSystemId ?? null,
    totals: parsed.summary.totals.map((system) => withPassRate(system)),
    scenarios: parsed.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      displayName: scenario.displayName,
      bestSystemId: scenario.bestSystemId ?? null,
      systems: scenario.systems.map((system) => withPassRate(system)),
    })),
  };
}
