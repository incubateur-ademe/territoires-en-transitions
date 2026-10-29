import { INestApplication } from '@nestjs/common';
import { getDisposableTestApp } from '@tet/backend/test';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EvalReport, RunOutcome, scenarioVerdict, writeReport } from './report';
import {
  createEvalContext,
  EvalContext,
  runScenario,
} from './assistant-eval.test-fixture';
import { SCENARIOS } from './scenarios';
import { computeAssistantVersions } from './versions';

/**
 * Évaluation réelle de l'assistant : appelle le modèle de `LLM_PROVIDER`.
 * Jamais dans la suite normale ; se lance par `make assistant-eval`.
 *
 * ASSISTANT_EVAL_SCENARIO / ASSISTANT_EVAL_TAG filtrent, ASSISTANT_EVAL_REPEAT
 * répète, ASSISTANT_EVAL_MAX_TOKENS arrête le run au-delà (les scénarios
 * restants sont « capped »).
 */
const env = process.env;
const scenarioFilter = env.ASSISTANT_EVAL_SCENARIO?.split(',').filter(Boolean);
const tagFilter = env.ASSISTANT_EVAL_TAG?.split(',').filter(Boolean);
const repeat = Number(env.ASSISTANT_EVAL_REPEAT || 1);
const maxTokens = Number(env.ASSISTANT_EVAL_MAX_TOKENS || 500_000);

// Sans base analytique réelle, la config vitest se rabat sur la base locale,
// qui n'a pas les tables de l'équipe data : ces scénarios n'y ont pas de sens.
const hasAnalyticsDatabase =
  !!env.ANALYTICS_DATABASE_URL &&
  env.ANALYTICS_DATABASE_URL !== env.SUPABASE_DATABASE_URL;

const selected = SCENARIOS.filter(
  (scenario) =>
    (!scenarioFilter || scenarioFilter.includes(scenario.id)) &&
    (!tagFilter || scenario.tags.some((tag) => tagFilter.includes(tag))) &&
    (hasAnalyticsDatabase || !scenario.tags.includes('analytique'))
);

/** Vertex lit un fichier de clé : on l'écrit hors du dépôt. */
const initGoogleCredentials = () => {
  if (env.GCLOUD_SERVICE_ACCOUNT_KEY && !env.GOOGLE_APPLICATION_CREDENTIALS) {
    const key = env.GCLOUD_SERVICE_ACCOUNT_KEY;
    const file = join(tmpdir(), `tet-assistant-eval-${process.pid}.json`);
    writeFileSync(
      file,
      key.includes('{') ? key : Buffer.from(key, 'base64').toString('utf-8'),
      { mode: 0o600 }
    );
    env.GOOGLE_APPLICATION_CREDENTIALS = file;
  }
};

describe.runIf(env.ASSISTANT_EVAL === '1')("Évaluation de l'assistant", () => {
  let app: INestApplication;
  let context: EvalContext;

  beforeAll(async () => {
    initGoogleCredentials();
    app = await getDisposableTestApp({});
    context = await createEvalContext(app);
    return async () => {
      await app.close();
    };
  });

  test(`${selected.length} scénario(s) × ${repeat}`, async () => {
    const outcomes: RunOutcome[] = [];
    let tokens = 0;
    for (const scenario of selected) {
      for (let run = 1; run <= repeat; run++) {
        if (tokens >= maxTokens) {
          outcomes.push({
            scenarioId: scenario.id,
            tags: scenario.tags,
            run,
            status: 'capped',
            failures: [],
            toolCalls: [],
            modelCalls: 0,
            durationMs: 0,
            totalTokens: 0,
          });
          continue;
        }
        const outcome = await runScenario(app, context, scenario, run);
        tokens += outcome.totalTokens;
        outcomes.push(outcome);
        console.info(
          `[assistant-eval] ${scenario.id} #${run} ${outcome.status} · ${
            outcome.toolCalls.map((call) => call.name).join(', ') ||
            'aucun outil'
          } · ${outcome.modelCalls} appels · ${Math.round(
            outcome.durationMs / 1000
          )} s · ${outcome.totalTokens} tokens`
        );
      }
    }

    const verdicts = Object.fromEntries(
      selected.map((scenario) => [
        scenario.id,
        scenarioVerdict(
          outcomes.filter((outcome) => outcome.scenarioId === scenario.id),
          scenario.tolerance?.pass ?? repeat
        ),
      ])
    );
    const versions = await computeAssistantVersions(
      app,
      context.viewers['support-super-admin']
    );
    const provider = String(app.get(ConfigurationService).get('LLM_PROVIDER'));
    const now = new Date();
    const report: EvalReport = {
      runId: `${now.toISOString().replace(/[:.]/g, '-')}-${provider}`,
      date: now.toISOString(),
      provider,
      model: app.get(LlmService).modelFor('strong') ?? null,
      promptVersion: versions.promptVersion,
      toolsetVersion: versions.toolsetVersion,
      repeat,
      outcomes,
    };
    const { markdown } = writeReport(
      join(__dirname, '../../../../../../reports/assistant-eval'),
      report,
      verdicts
    );
    console.info(`[assistant-eval] rapport : ${markdown}`);
    console.info(`[assistant-eval] versions : ${JSON.stringify(versions)}`);
  });
});
