import { INestApplication } from '@nestjs/common';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { LlmRepository } from '@tet/backend/utils/llm/repositories/llm.repository';
import baseline from './baseline.json';
import { SCENARIOS } from './scenarios';
import { computeAssistantVersions } from './versions';

/**
 * Gratuit, dans la suite normale : ce que voit le modèle n'a pas changé depuis
 * la dernière éval réelle, et chaque outil MCP est exercé par un scénario.
 */
describe("Scénarios d'évaluation de l'assistant", () => {
  let app: INestApplication;
  let support: AuthenticatedUser;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) =>
        builder
          .overrideProvider(LlmRepository)
          .useValue(new FakeLlmRepository()),
    });
    const db = await getTestDatabase(app);
    const { user } = await addTestUser(db, { verified: false });
    await addUserRoleSupport({
      databaseService: db,
      userId: user.id,
      isSupport: true,
      isSuperAdminRoleEnabled: true,
    });
    support = getAuthUserFromUserCredentials(user);

    return async () => {
      await app.close();
    };
  });

  test('identifiants uniques', () => {
    const ids = SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('chaque outil MCP est couvert par au moins un scénario', async () => {
    const { toolNames } = await computeAssistantVersions(app, support);
    const covered = new Set(
      SCENARIOS.flatMap((scenario) => [
        ...(scenario.expect.tools ?? []).map((tool) => tool.name),
        ...(scenario.expect.anyTool ?? []),
      ])
    );

    expect(toolNames.filter((name) => !covered.has(name))).toEqual([]);
    expect([...covered].filter((name) => !toolNames.includes(name))).toEqual(
      []
    );
  });

  test('prompt et outils inchangés depuis la dernière éval (sinon : make assistant-eval puis mettre à jour baseline.json)', async () => {
    const { promptVersion, toolsetVersion } = await computeAssistantVersions(
      app,
      support
    );

    expect({ promptVersion, toolsetVersion }).toEqual({
      promptVersion: baseline.promptVersion,
      toolsetVersion: baseline.toolsetVersion,
    });
  });
});
