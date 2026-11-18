import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AssistantToolCallTrace } from '../ask-assistant.service';
import { ExpectationFailure } from './expectations';

export type RunOutcome = {
  scenarioId: string;
  tags: string[];
  run: number;
  /** `unavailable` : un prérequis externe manquait (GitHub), l'agent n'est pas jugé. */
  status: 'pass' | 'fail' | 'error' | 'capped' | 'unavailable';
  failures: ExpectationFailure[];
  error?: string;
  answer?: string;
  toolCalls: Pick<AssistantToolCallTrace, 'name' | 'arguments' | 'isError'>[];
  modelCalls: number;
  durationMs: number;
  totalTokens: number;
};

export type EvalReport = {
  runId: string;
  date: string;
  provider: string;
  model: string | null;
  promptVersion: string;
  toolsetVersion: string;
  repeat: number;
  outcomes: RunOutcome[];
};

export const scenarioVerdict = (
  outcomes: RunOutcome[],
  requiredPasses: number
): 'pass' | 'fail' | 'flaky' | 'capped' | 'unavailable' => {
  if (outcomes.every((outcome) => outcome.status === 'capped')) {
    return 'capped';
  }
  // Une exécution sans son prérequis externe ne compte ni pour ni contre l'agent.
  const judged = outcomes.filter(
    (outcome) => outcome.status !== 'capped' && outcome.status !== 'unavailable'
  );
  if (judged.length === 0) {
    return 'unavailable';
  }
  const passes = judged.filter((outcome) => outcome.status === 'pass').length;
  if (passes >= Math.min(requiredPasses, judged.length)) {
    return passes === judged.length ? 'pass' : 'flaky';
  }
  return 'fail';
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

export const renderMarkdown = (
  report: EvalReport,
  verdicts: Record<string, string>
): string => {
  const ran = report.outcomes.filter(
    (outcome) => outcome.status !== 'capped' && outcome.status !== 'unavailable'
  );
  const passed = Object.values(verdicts).filter((v) => v === 'pass').length;
  const lines = [
    `# Évaluation de l'assistant — ${report.provider} (${report.model ?? '?'})`,
    '',
    `Run \`${report.runId}\` du ${report.date} · prompt \`${report.promptVersion}\` · outils \`${report.toolsetVersion}\` · ${report.repeat} exécution(s) par scénario`,
    '',
    `**${passed} / ${
      Object.keys(verdicts).length
    } scénarios réussis.** Tokens : ${ran.reduce(
      (total, outcome) => total + outcome.totalTokens,
      0
    )} · durée médiane : ${Math.round(
      median(ran.map((outcome) => outcome.durationMs)) / 1000
    )} s · appels au modèle médians : ${median(
      ran.map((outcome) => outcome.modelCalls)
    )}`,
    '',
    '| Scénario | Tags | Verdict | Outils appelés | Appels modèle | Durée | Écarts |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const [scenarioId, verdict] of Object.entries(verdicts)) {
    const outcome = report.outcomes.find((o) => o.scenarioId === scenarioId);
    if (!outcome) continue;
    lines.push(
      `| ${scenarioId} | ${outcome.tags.join(', ')} | ${verdict} | ${
        outcome.toolCalls
          .map((call) => `${call.name}${call.isError ? ' ✗' : ''}`)
          .join(', ') || '—'
      } | ${outcome.modelCalls} | ${Math.round(
        outcome.durationMs / 1000
      )} s | ${
        outcome.error ??
        (outcome.failures
          .map((failure) => `${failure.code} ${failure.detail}`)
          .join(' ; ') ||
          '—')
      } |`
    );
  }
  lines.push('', '## Réponses', '');
  for (const outcome of report.outcomes) {
    lines.push(
      `### ${outcome.scenarioId} (run ${outcome.run}, ${outcome.status})`,
      '',
      '```text',
      (outcome.answer ?? outcome.error ?? '').slice(0, 2_000),
      '```',
      ''
    );
  }
  return lines.join('\n');
};

export const writeReport = (
  outDir: string,
  report: EvalReport,
  verdicts: Record<string, string>
): { json: string; markdown: string } => {
  mkdirSync(outDir, { recursive: true });
  const base = join(outDir, report.runId);
  const json = `${base}.json`;
  const markdown = `${base}.md`;
  writeFileSync(json, JSON.stringify({ ...report, verdicts }, null, 2));
  writeFileSync(markdown, renderMarkdown(report, verdicts));
  writeFileSync(join(outDir, 'latest.md'), renderMarkdown(report, verdicts));
  return { json, markdown };
};
