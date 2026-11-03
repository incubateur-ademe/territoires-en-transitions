import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { ApplySegmentTaggingService } from './apply-segment-tagging.service';
import { CrispApiClient, CrispConversation } from './crisp-api.client';
import { PrepareSegmentTaggingService } from './prepare-segment-tagging.service';
import {
  signSegmentTaggingAction,
  verifySegmentTaggingToken,
} from './segment-tagging-token.rules';
import { SupportConversationsService } from './support-conversations.service';

const SECRET = 'secret-de-test';
const support = { id: 'support-1' } as AuthenticatedUser;

const conversation = (
  id: string,
  date: string,
  segments: string[],
  message: string
): CrispConversation & { message: string } => ({
  session_id: id,
  created_at: Date.parse(`${date}T10:00:00Z`),
  updated_at: Date.parse(`${date}T11:00:00Z`),
  meta: { segments },
  message,
});

const CONVERSATIONS = [
  conversation(
    'a',
    '2026-10-02',
    ['bug_indicateur'],
    'Le nouveau référentiel est-il ouvert ?'
  ),
  conversation(
    'b',
    '2026-10-03',
    ['besoin_guidage_référentiel_cr'],
    'Nouveau référentiel : où le trouver ?'
  ),
  conversation('c', '2026-10-04', [], 'Je ne peux pas me connecter'),
  conversation(
    'd',
    '2026-10-05',
    ['besoin_guidage_referentiel_cr'],
    'Question sur le CR'
  ),
];

function build({ mutate = true } = {}) {
  const segments = new Map(
    CONVERSATIONS.map((c) => [c.session_id, [...(c.meta?.segments ?? [])]])
  );
  const client = {
    isConfigured: () => true,
    listConversationsActiveSince: vi.fn(async () =>
      success({ conversations: CONVERSATIONS, truncated: false })
    ),
    listMessages: vi.fn(async ({ session_id }: CrispConversation) =>
      success([
        {
          from: 'user',
          type: 'text',
          content: CONVERSATIONS.find((c) => c.session_id === session_id)
            ?.message,
          timestamp: 0,
        },
      ])
    ),
    getSegments: vi.fn(async (id: string) => success(segments.get(id) ?? [])),
    updateSegments: vi.fn(async (id: string, next: string[]) => {
      segments.set(id, next);
      return success(undefined);
    }),
  } as unknown as CrispApiClient;
  const permissions = {
    isAllowed: vi.fn(async (_user: unknown, operation: string) =>
      operation === 'utils.mcp.mutate' && !mutate
        ? failure('UNAUTHORIZED')
        : success(undefined)
    ),
  } as unknown as PermissionService;
  const config = {
    get: (key: string) => (key === 'SUPABASE_JWT_SECRET' ? SECRET : undefined),
  } as unknown as ConfigurationService;
  const selection = new SupportConversationsService(client, permissions);
  return {
    prepare: new PrepareSegmentTaggingService(
      selection,
      client,
      permissions,
      config
    ),
    apply: new ApplySegmentTaggingService(client, permissions, config),
    client,
    segments,
  };
}

const FILTER = { dateFrom: '2026-10-01', dateTo: '2026-10-31' };

describe('ajout de segment par l’assistant', () => {
  test("prépare sans écrire, avec l'orthographe existante du segment", async () => {
    const { prepare, client } = build();

    const result = await prepare.run(
      {
        ...FILTER,
        termes: ['nouveau référentiel'],
        segment: 'Besoin_guidage_referentiel_CR',
      },
      { user: support }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        // deux orthographes à égalité : la première rencontrée
        segment: 'besoin_guidage_référentiel_cr',
        segmentExistant: true,
        conversations: 1,
        dejaTaguees: 1,
        echantillon: [
          {
            date: '2026-10-02',
            demande: 'Le nouveau référentiel est-il ouvert ?',
          },
        ],
      },
    });
    expect(client.updateSegments).not.toHaveBeenCalled();
  });

  test("pas de jeton quand il n'y a rien à étiqueter", async () => {
    const result = await build().prepare.run(
      { ...FILTER, termes: 'connecter', segment: 'autre_hors_perimetre' },
      { user: support }
    );
    expect(result).toMatchObject({
      success: true,
      data: { conversations: 1, actionToken: expect.any(String) },
    });

    const none = await build().prepare.run(
      { ...FILTER, termes: ['introuvable'], segment: 'autre_hors_perimetre' },
      { user: support }
    );
    expect(none).toMatchObject({
      success: true,
      data: { conversations: 0, actionToken: null },
    });
  });

  test('ignore un filtre sujet égal au segment à ajouter', async () => {
    const result = await build().prepare.run(
      {
        ...FILTER,
        sujet: 'besoin_guidage_referentiel_cr',
        termes: ['nouveau référentiel'],
        segment: 'besoin_guidage_referentiel_cr',
      },
      { user: support }
    );

    expect(result).toMatchObject({
      success: true,
      data: { conversations: 1, remarque: expect.stringContaining('ignoré') },
    });
  });

  test('signale un segment inconnu et propose les segments proches', async () => {
    const { prepare } = build();

    const result = await prepare.run(
      { ...FILTER, termes: ['connecter'], segment: 'bug_connexion_cr' },
      { user: support }
    );

    expect(result).toMatchObject({
      success: true,
      data: { segmentExistant: false, conversations: 1 },
    });
    expect(result.success && result.data.segmentsProches[0]).toMatch(/_cr$/);
  });

  test('refuse sans rôle support, et sans filtre', async () => {
    expect(
      await build({ mutate: false }).prepare.run(
        { ...FILTER, sujet: 'cr', segment: 'x_cr' },
        { user: support }
      )
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    expect(
      await build().prepare.run(
        { ...FILTER, segment: 'x_cr' },
        { user: support }
      )
    ).toMatchObject({ success: false, error: 'FILTER_REQUIRED' });
  });

  test('applique le jeton : ajoute aux segments existants, ignore les déjà taguées', async () => {
    const { prepare, apply, segments } = build();
    const prepared = await prepare.run(
      { ...FILTER, termes: ['nouveau référentiel'], segment: 'bug_indicateur' },
      { user: support }
    );
    if (!prepared.success || !prepared.data.actionToken) {
      throw new Error('préparation attendue');
    }
    // entre-temps, quelqu'un a déjà ajouté le segment à la main
    segments.set('b', ['besoin_guidage_référentiel_cr', 'Bug_Indicateur']);

    const result = await apply.run(
      { actionToken: prepared.data.actionToken },
      { user: support }
    );

    expect(result).toEqual(
      success({
        segment: 'bug_indicateur',
        ajoutes: 0,
        dejaPresents: 1,
        echecs: 0,
      })
    );
    expect(segments.get('a')).toEqual(['bug_indicateur']);
  });

  test("refuse le jeton d'un autre utilisateur, ou sans rôle support", async () => {
    const token = signSegmentTaggingAction(
      {
        userId: 'autre',
        segment: 'bug_cr',
        sessionIds: ['a'],
        expiresAt: Date.now() + 60_000,
      },
      SECRET
    );
    expect(
      await build().apply.run({ actionToken: token }, { user: support })
    ).toMatchObject({ success: false, error: 'INVALID_TOKEN' });
    expect(
      await build({ mutate: false }).apply.run(
        { actionToken: token },
        { user: support }
      )
    ).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
  });
});

describe('jeton signé', () => {
  const action = {
    userId: 'u',
    segment: 's',
    sessionIds: ['a'],
    expiresAt: 2_000,
  };

  test('vérifie la signature et la date', () => {
    const token = signSegmentTaggingAction(action, SECRET);
    expect(verifySegmentTaggingToken(token, SECRET, 1_000)).toEqual({
      ok: true,
      action,
    });
    expect(verifySegmentTaggingToken(token, SECRET, 3_000)).toEqual({
      ok: false,
      error: 'EXPIRED_TOKEN',
    });
    expect(verifySegmentTaggingToken(token, 'autre-secret', 1_000)).toEqual({
      ok: false,
      error: 'INVALID_TOKEN',
    });
  });

  test('refuse un jeton modifié', () => {
    const [, signature] = signSegmentTaggingAction(action, SECRET).split('.');
    const forged = Buffer.from(
      JSON.stringify({ ...action, sessionIds: ['a', 'b'] })
    ).toString('base64url');
    expect(
      verifySegmentTaggingToken(`${forged}.${signature}`, SECRET, 1_000)
    ).toEqual({ ok: false, error: 'INVALID_TOKEN' });
  });
});
