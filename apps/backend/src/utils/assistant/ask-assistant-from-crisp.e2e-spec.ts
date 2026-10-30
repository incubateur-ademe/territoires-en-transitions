import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getServiceRoleUser,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  AuthJwtPayload,
  AuthRole,
  buildRequesterUser,
  jwtToUser,
} from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { LlmRepository } from '@tet/backend/utils/llm/repositories/llm.repository';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole, ResourceType } from '@tet/domain/users';
import { buildCrispSupportUser } from './support-elevation';

describe('Assistant depuis Crisp (/tet)', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  const llm = new FakeLlmRepository();
  let collectiviteId: number;
  let collectiviteNom: string;
  let visitorEmail: string;
  let operatorId: string;
  let operatorEmail: string;
  let notSupportEmail: string;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) =>
        builder.overrideProvider(LlmRepository).useValue(llm),
    });
    const db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectiviteId = fixture.collectivite.id;
    collectiviteNom = fixture.collectivite.nom ?? '';
    visitorEmail = fixture.user.email ?? '';

    // Support sans mode super admin, membre d'aucune collectivité.
    const { user: operator } = await addTestUser(db, { verified: false });
    await addUserRoleSupport({
      databaseService: db,
      userId: operator.id,
      isSupport: true,
      isSuperAdminRoleEnabled: false,
    });
    operatorId = operator.id;
    operatorEmail = (operator.email ?? '').toUpperCase();

    const { user: other } = await addTestUser(db);
    notSupportEmail = other.email ?? '';

    return async () => {
      await app.close();
    };
  });

  beforeEach(() => llm.reset());

  const callerAsService = () =>
    router.createCaller({ user: getServiceRoleUser() });

  test('répond au nom du support, en lecture élevée, avec le contexte de la conversation', async () => {
    llm.enqueue(
      {
        toolCalls: [
          { id: 'c1', name: 'get_collectivite', arguments: { collectiviteId } },
        ],
      },
      { text: `Il travaille pour ${collectiviteNom}.` }
    );

    const answer = await callerAsService().assistant.askFromCrisp({
      operatorEmail,
      question: 'Pour qui travaille-t-il ?',
      visitorEmail,
      visitorMessages: ['Bonjour, je ne trouve pas mon plan.'],
      history: [
        { role: 'user', text: 'Qui est-ce ?' },
        { role: 'assistant', text: 'Un agent de la collectivité.' },
      ],
    });

    expect(answer).toMatchObject({
      answer: `Il travaille pour ${collectiviteNom}.`,
      toolCalls: [{ name: 'get_collectivite', isError: false }],
    });
    const [first] = llm.requests;
    expect(first.systemInstruction).toContain('membre du support');
    expect(first.messages).toHaveLength(3);
    const question = first.messages.at(-1);
    expect(question).toMatchObject({
      role: 'user',
      text: expect.stringContaining('Profil TeT (find_user)'),
    });
    expect(question?.role === 'user' && question.text).toContain(
      collectiviteNom
    );
    expect(question?.role === 'user' && question.text).toContain(
      '> Bonjour, je ne trouve pas mon plan.'
    );
    expect(question?.role === 'user' && question.text).toMatch(
      /Question du support : Pour qui travaille-t-il \?$/
    );
  });

  test('opérateur sans compte TeT ou sans rôle support : refus explicite', async () => {
    await expect(
      callerAsService().assistant.askFromCrisp({
        operatorEmail: 'inconnu@example.com',
        question: 'Q',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    await expect(
      callerAsService().assistant.askFromCrisp({
        operatorEmail: notSupportEmail,
        question: 'Q',
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(llm.requests).toHaveLength(0);
  });

  test('réservé au jeton service', async () => {
    const db = await getTestDatabase(app);
    const { user } = await addTestUser(db);
    await expect(
      router
        .createCaller({ user: getAuthUserFromUserCredentials(user) })
        .assistant.askFromCrisp({ operatorEmail, question: 'Q' })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test("l'élévation ouvre les lectures des outils, jamais une écriture", async () => {
    const permissions = app.get(PermissionService);
    const resource = { collectiviteId };

    const plain = await permissions.isAllowed(
      buildRequesterUser(operatorId),
      'plans.read',
      ResourceType.COLLECTIVITE,
      resource
    );
    expect(plain.success).toBe(false);

    const elevated = buildCrispSupportUser(operatorId);
    const read = await permissions.isAllowed(
      elevated,
      'plans.read',
      ResourceType.COLLECTIVITE,
      resource
    );
    expect(read.success).toBe(true);
    const write = await permissions.isAllowed(
      elevated,
      'plans.mutate',
      ResourceType.COLLECTIVITE,
      resource
    );
    expect(write.success).toBe(false);
  });

  test("un jeton ne peut pas porter l'élévation", () => {
    const user = jwtToUser({
      role: AuthRole.AUTHENTICATED,
      sub: operatorId,
      supportElevation: 'crisp',
    } as AuthJwtPayload);

    expect(user).not.toHaveProperty('supportElevation');
  });
});
