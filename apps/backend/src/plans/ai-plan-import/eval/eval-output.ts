import { mkdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import type { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import { normalizeExtractedActions } from '../adapters/extracted-action-to-import-action';
import type { PipelineOutcome } from '../pipeline/run-import-pipeline';
import {
  compareWithManualReference,
  compareWithReference,
  computeEvalMetrics,
  EvalDiff,
  EvalMetrics,
  EvalRun,
  isManualReference,
  ManualReferenceDiff,
} from './eval-metrics';
import type { GenericEvalInput } from './read-eval-input';

export type EvalOutput = EvalRun & {
  file: string;
  provider: string;
  model: string | undefined;
  generatedAt: string;
  options: GenericEvalInput['options'];
  status: 'done' | 'failed';
  error: string | null;
  warnings: string[];
  stepStates: unknown;
  plan: EvalRun['draft'];
  diff: EvalDiff | ManualReferenceDiff | null;
};

export const buildEvalOutput = ({
  input,
  outcome,
  events,
  durationMs,
  provider,
  model,
}: {
  input: GenericEvalInput;
  outcome: PipelineOutcome;
  events: LlmCallEvent[];
  durationMs: number;
  provider: string;
  model: string | undefined;
}): EvalOutput => {
  // Un échec conserve les actions des étapes précédentes pour le diagnostic.
  const draft =
    outcome.status === 'done' ? outcome.draft : outcome.partialDraft;
  // La référence manuelle juge le plan normalisé tel qu'il sera créé ; les
  // métriques et les comparaisons entre runs portent sur le brouillon brut.
  const plan = {
    ...draft,
    actions: normalizeExtractedActions(draft.actions).actions,
  };
  const metrics = computeEvalMetrics({ draft, events, durationMs });
  const { reference } = input;
  const diff =
    reference === null
      ? null
      : isManualReference(reference)
      ? compareWithManualReference({ draft: plan, metrics }, reference)
      : compareWithReference({ draft, metrics }, reference);
  return {
    file: basename(input.file),
    provider,
    model,
    generatedAt: new Date().toISOString(),
    options: input.options,
    status: outcome.status,
    error:
      outcome.status === 'failed'
        ? `${outcome.failedStep}: ${outcome.error.kind}`
        : null,
    stepStates: outcome.stepStates,
    warnings: outcome.warnings,
    metrics,
    draft,
    plan,
    diff,
  };
};

export const print = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

export const printEvalSummary = (output: EvalOutput): void => {
  printMetrics(output.metrics, output.status, output.error);
  for (const warning of output.warnings) {
    print(`  ⚠ ${warning}`);
  }
  if (output.diff) {
    if ('deltas' in output.diff) {
      printDiff(output.diff);
    } else {
      printManualDiff(output.diff);
    }
  }
};

export const writeOutput = async (
  output: unknown,
  { file, out, provider }: { file: string; out?: string; provider: string }
): Promise<string> => {
  const outPath =
    out ??
    join(
      'eval-out',
      `${basename(file, extname(file))}-${provider}-${Date.now()}.json`
    );
  await mkdir(join(outPath, '..'), { recursive: true });
  await writeFile(outPath, JSON.stringify(output, null, 2));
  return outPath;
};

const printMetrics = (
  metrics: EvalMetrics,
  status: string,
  error: string | null
): void => {
  print(`Statut : ${status}${error ? ` (${error})` : ''}`);
  print(
    `Actions ${metrics.actions} (sans axe ${metrics.actionsSansAxe}) · axes ${metrics.axes} · sous-axes ${metrics.sousAxes} · profondeur ${metrics.profondeurAxes} · sous-actions ${metrics.sousActions}`
  );
  print(
    `Remplissage : ${Object.entries(metrics.fillRates)
      .map(([field, rate]) => `${field} ${Math.round(rate * 100)} %`)
      .join(', ')}`
  );
  print(
    `Appels ${metrics.calls} (429 : ${metrics.rateLimited}, échecs : ${
      metrics.failedCalls
    }) · tokens ${metrics.tokens.totalTokens} (entrée ${
      metrics.tokens.promptTokens
    }) · durée ${Math.round(metrics.durationMs / 1000)} s`
  );
};

const printDiff = (diff: EvalDiff): void => {
  const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);
  print(
    `Écarts vs référence : ${Object.entries(diff.deltas)
      .filter(([key]) => key !== 'durationMs')
      .map(([key, delta]) => `${key} ${signed(delta)}`)
      .join(', ')}`
  );
  print(
    `Titres de la référence introuvables : ${diff.missingTitles.length}${
      diff.missingTitles.length > 0
        ? `\n  - ${diff.missingTitles.slice(0, 30).join('\n  - ')}`
        : ''
    }`
  );
  print(`Titres en trop : ${diff.extraTitles.length}`);
};

const printManualDiff = (diff: ManualReferenceDiff): void => {
  const list = (titles: string[]) =>
    titles.length > 0 ? `\n  - ${titles.slice(0, 30).join('\n  - ')}` : '';
  print(
    `Structure attendue : axes ${diff.axes.actual}/${diff.axes.expected}, actions retrouvées ${diff.actions.found}/${diff.actions.expected} (${diff.actions.actual} extraites)`
  );
  if (diff.axisLevels) {
    print(
      `Niveaux d'axes distincts par profondeur : ${diff.axisLevels.actual.join(
        ' / '
      )} (attendus : ${diff.axisLevels.expected.join(' / ')})`
    );
  }
  if (diff.axes.missing.length > 0) {
    print(
      `Axes introuvables : ${diff.axes.missing.length}${list(
        diff.axes.missing
      )}`
    );
  }
  print(
    `Actions introuvables : ${diff.missingTitles.length}${list(
      diff.missingTitles
    )}`
  );
  if (diff.titlesFoundAsSousAxe.length > 0) {
    print(
      `… dont retrouvées en sous-axe (niveau inventé) : ${
        diff.titlesFoundAsSousAxe.length
      }${list(diff.titlesFoundAsSousAxe)}`
    );
  }
  print(
    `Actions sous un autre axe : ${diff.misplacedTitles.length}${list(
      diff.misplacedTitles.map(
        (m) =>
          `${m.titre} (attendu : ${m.expectedAxe} ; obtenu : ${m.actualAxe})`
      )
    )}`
  );
  if (diff.misplacedPaths.length > 0) {
    print(
      `Actions sous le bon axe mais à un autre chemin : ${
        diff.misplacedPaths.length
      }${list(
        diff.misplacedPaths.map(
          (m) =>
            `${m.titre} (attendu : ${m.expectedPath} ; obtenu : ${m.actualPath})`
        )
      )}`
    );
  }
  print(`Titres en trop : ${diff.extraTitles.length}${list(diff.extraTitles)}`);
};
