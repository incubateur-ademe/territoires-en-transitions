import { INestApplication, Logger } from '@nestjs/common';
import {
  attachTestPlanToDemarchePcaet,
  createDemarche,
} from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';
import { CollectiviteRole } from '@tet/domain/users';
import { recordLlmCalls } from '@tet/backend/utils/llm/llm-call-recorder';
import { AskAssistantFromCrispService } from '../ask-assistant-from-crisp.service';
import { AskAssistantService } from '../ask-assistant.service';
import { checkExpectations, EvalFixture, resolveText } from './expectations';
import { RunOutcome } from './report';
import { Scenario, Viewer } from './scenario';

export type EvalContext = {
  fixture: EvalFixture;
  viewers: Record<Viewer, AuthenticatedUser & { email: string }>;
};

const PLAN_NOM = 'Plan climat de la vallée';

/**
 * Collectivité neuve par run : une démarche PCAET en élaboration, un plan
 * rattaché, un membre admin ; puis deux comptes support, l'un en mode super admin.
 */
export const createEvalContext = async (
  app: INestApplication
): Promise<EvalContext> => {
  const db = await getTestDatabase(app);
  const router = await getTestRouter(app);
  const demarche = await createDemarche(db, router);
  await attachTestPlanToDemarchePcaet(db, {
    collectiviteId: demarche.collectiviteId,
    demarcheId: demarche.demarche.id,
    nom: PLAN_NOM,
  });

  const supportUser = async (isSuperAdminRoleEnabled: boolean) => {
    const { user } = await addTestUser(db, { verified: false });
    await addUserRoleSupport({
      databaseService: db,
      userId: user.id,
      isSupport: true,
      isSuperAdminRoleEnabled,
    });
    return { ...getAuthUserFromUserCredentials(user), email: user.email ?? '' };
  };

  const { user: membre } = await addTestUser(db, {
    collectiviteId: demarche.collectiviteId,
    role: CollectiviteRole.ADMIN,
  });

  return {
    fixture: {
      'collectivite.id': demarche.collectiviteId,
      'collectivite.nom': demarche.collectivite.nom ?? '',
      'plan.nom': PLAN_NOM,
      'membre.email': membre.email ?? '',
      'membre.nom': membre.nom ?? '',
    },
    viewers: {
      'support-super-admin': await supportUser(true),
      'support-sans-mode': await supportUser(false),
    },
  };
};

export const runScenario = async (
  app: INestApplication,
  context: EvalContext,
  scenario: Scenario,
  run: number
): Promise<RunOutcome> => {
  const startedAt = Date.now();
  const base = {
    scenarioId: scenario.id,
    tags: scenario.tags,
    run,
    failures: [],
    toolCalls: [],
    modelCalls: 0,
    totalTokens: 0,
  };
  try {
    const question = resolveText(scenario.say, context.fixture);
    const viewer = context.viewers[scenario.viewer ?? 'support-super-admin'];
    // Les scénarios support passent par le chemin de Crisp : opérateur
    // retrouvé par e-mail, lecture élevée, contexte de la conversation.
    const { result, calls } = await recordLlmCalls(() =>
      scenario.support
        ? app.get(AskAssistantFromCrispService).askFromCrisp({
            operatorEmail: viewer.email,
            question,
            visitorEmail: String(context.fixture['membre.email']),
            visitorMessages: scenario.support.visitorMessages ?? [],
            history: (scenario.support.history ?? []).map((entry) => ({
              ...entry,
              text: resolveText(entry.text, context.fixture),
            })),
          })
        : app.get(AskAssistantService).ask(
            {
              question,
              mode: scenario.mode ?? 'analyse',
              ...(scenario.esquisse ? { esquisse: scenario.esquisse } : {}),
            },
            { user: viewer }
          )
    );
    const totalTokens = calls.reduce(
      (total, call) => total + (call.usage?.totalTokens ?? 0),
      0
    );
    if (!result.success) {
      return {
        ...base,
        status: 'error',
        error: `${result.error}${
          result.cause ? ` : ${result.cause.message}` : ''
        }`,
        modelCalls: calls.length,
        durationMs: Date.now() - startedAt,
        totalTokens,
      };
    }
    const failures = checkExpectations(scenario, result.data, context.fixture);
    return {
      ...base,
      status: failures.length === 0 ? 'pass' : 'fail',
      failures,
      answer: result.data.answer,
      toolCalls: result.data.toolCalls.map(
        ({ name, arguments: args, isError }) => ({
          name,
          arguments: args,
          isError,
        })
      ),
      modelCalls: result.data.modelCalls,
      durationMs: Date.now() - startedAt,
      totalTokens,
    };
  } catch (error) {
    new Logger('AssistantEval').error(error);
    return {
      ...base,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    };
  }
};
