import { INestApplication } from '@nestjs/common';
import { createDemarche } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { LlmRepository } from '@tet/backend/utils/llm/repositories/llm.repository';
import { AskAssistantService } from './ask-assistant.service';

describe('Assistant (agent sur le serveur MCP)', () => {
  let app: INestApplication;
  const llm = new FakeLlmRepository();
  let superAdmin: AuthenticatedUser;
  let lambda: AuthenticatedUser;
  let collectiviteId: number;
  let collectiviteNom: string;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) =>
        builder.overrideProvider(LlmRepository).useValue(llm),
    });
    const db = await getTestDatabase(app);
    const router = await getTestRouter(app);
    const fixture = await createDemarche(db, router);
    collectiviteId = fixture.collectiviteId;
    collectiviteNom = fixture.collectivite.nom;

    const { user } = await addTestUser(db, { verified: false });
    await addUserRoleSupport({
      databaseService: db,
      userId: user.id,
      isSupport: true,
      isSuperAdminRoleEnabled: true,
    });
    superAdmin = getAuthUserFromUserCredentials(user);
    const { user: other } = await addTestUser(db);
    lambda = getAuthUserFromUserCredentials(other);

    return async () => {
      await app.close();
    };
  });

  beforeEach(() => llm.reset());

  const ask = (question: string, user = superAdmin) =>
    app.get(AskAssistantService).ask({ question }, { user });

  test('enchaîne un outil MCP puis répond, avec le prompt et les outils du serveur', async () => {
    llm.enqueue(
      {
        text: 'Je regarde la collectivité.',
        toolCalls: [
          { id: 'c1', name: 'get_collectivite', arguments: { collectiviteId } },
        ],
      },
      { text: `La collectivité s'appelle ${collectiviteNom}.` }
    );

    const result = await ask('Comment s’appelle cette collectivité ?');

    expect(result).toMatchObject({
      success: true,
      data: {
        answer: `La collectivité s'appelle ${collectiviteNom}.`,
        stopReason: 'answered',
        modelCalls: 2,
        model: 'fake-model',
        toolCalls: [
          {
            name: 'get_collectivite',
            isError: false,
            resultPreview: expect.stringContaining(collectiviteNom),
          },
        ],
      },
    });

    const [first, second] = llm.requests;
    expect(first.systemInstruction).toContain('Règles métier');
    expect(first.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(['get_collectivite', 'run_sql_query'])
    );
    expect(first.tools[0].parameters).not.toHaveProperty('$schema');
    expect(second.messages.at(-1)).toMatchObject({
      role: 'tool',
      toolCallId: 'c1',
      content: expect.stringContaining(collectiviteNom),
    });
  });

  test('outil inconnu et arguments illisibles reviennent au modèle en erreur', async () => {
    llm.enqueue(
      {
        toolCalls: [
          { id: 'a', name: 'drop_database', arguments: {} },
          {
            id: 'b',
            name: 'get_collectivite',
            arguments: {},
            argumentsError: 'Arguments JSON illisibles : {collectivite',
          },
          {
            id: 'c',
            name: 'get_collectivite',
            arguments: { collectiviteId: 'x' },
          },
        ],
      },
      { text: 'Je ne peux pas répondre.' }
    );

    const result = await ask('Teste les erreurs');

    expect(result.success).toBe(true);
    const toolMessages = llm.requests[1].messages.filter(
      (message) => message.role === 'tool'
    );
    expect(toolMessages).toHaveLength(3);
    expect(toolMessages[0]).toMatchObject({
      content: expect.stringContaining('Outil inconnu : drop_database'),
    });
    expect(toolMessages[1]).toMatchObject({
      content: expect.stringContaining('Arguments JSON illisibles'),
    });
    expect(toolMessages[2]).toMatchObject({
      content: expect.stringMatching(/^ERREUR/),
    });
  });

  test('au plafond d’appels, un dernier tour sans outils force la réponse', async () => {
    const loop = {
      toolCalls: [
        { id: 'l', name: 'get_collectivite', arguments: { collectiviteId } },
      ],
    };
    llm.enqueue(...Array.from({ length: 7 }, () => loop), {
      text: 'Réponse partielle.',
    });

    const result = await ask('Boucle');

    expect(result).toMatchObject({
      success: true,
      data: {
        answer: 'Réponse partielle.',
        stopReason: 'max_model_calls',
        modelCalls: 8,
      },
    });
    const last = llm.requests.at(-1);
    expect(last?.toolChoice).toBe('none');
    expect(last?.messages.at(-1)).toMatchObject({
      role: 'user',
      text: expect.stringContaining("Limite d'appels"),
    });
  });

  test('mode esquisse : le prompt d’esquisse et ses arguments', async () => {
    llm.enqueue({ text: '## 🤔 Problème\n…' });

    const result = await app.get(AskAssistantService).ask(
      {
        question: 'Rédige l’esquisse',
        mode: 'esquisse',
        esquisse: {
          sujet: 'activation des petites communes',
          appetit: 'petite',
        },
      },
      { user: superAdmin }
    );

    expect(result.success).toBe(true);
    expect(llm.requests[0].systemInstruction).toContain(
      'activation des petites communes'
    );
    expect(llm.requests[0].systemInstruction).toContain('Petite fournée');
  });

  test('erreur du modèle : LLM_ERROR', async () => {
    llm.enqueue({ error: { kind: 'api_error', httpStatus: 400 } });

    expect(await ask('Erreur')).toMatchObject({
      success: false,
      error: 'LLM_ERROR',
    });
  });

  test('sans utils.mcp.read : UNAUTHORIZED, sans appel au modèle', async () => {
    expect(await ask('Question', lambda)).toMatchObject({
      success: false,
      error: 'UNAUTHORIZED',
    });
    expect(llm.requests).toHaveLength(0);
  });

  test('par tRPC : assistant.ask', async () => {
    llm.enqueue({ text: 'Bonjour.' });
    const caller = (await getTestRouter(app)).createCaller({
      user: superAdmin,
    });

    await expect(
      caller.assistant.ask({ question: 'Bonjour ?' })
    ).resolves.toMatchObject({ answer: 'Bonjour.', stopReason: 'answered' });
  });
});
