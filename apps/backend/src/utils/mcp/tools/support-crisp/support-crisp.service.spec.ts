import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import {
  CrispConversation,
  CrispMessage,
  CrispApiClient,
} from './crisp-api.client';
import { GetSupportStatsService } from './get-support-stats.service';
import { SampleSupportConversationsService } from './sample-support-conversations.service';
import {
  resolvePeriod,
  SupportConversationsService,
} from './support-conversations.service';

const user = { id: 'support-1' } as AuthenticatedUser;
const MINUTE = 60_000;

const conversation = (
  id: string,
  date: string,
  segments: string[],
  state = 'resolved'
): CrispConversation => ({
  session_id: id,
  created_at: Date.parse(`${date}T10:00:00Z`),
  updated_at: Date.parse(`${date}T12:00:00Z`),
  state,
  meta: { segments },
});

const CONVERSATIONS = [
  conversation('a', '2026-09-02', [
    'besoin_guidage_referentiel_cr',
    'assistant accepté',
  ]),
  conversation('b', '2026-09-20', [
    'besoin_guidage_référentiel_cr',
    'support demandé',
  ]),
  conversation('c', '2026-10-05', [
    'bug_referentiel_cr',
    'metier_referentiel_cr',
  ]),
  conversation('d', '2026-10-06', ['bug_indicateur']),
  conversation('e', '2026-10-07', []),
  // hors période : créée avant, active pendant
  conversation('f', '2026-07-01', ['besoin_guidage_referentiel_cr']),
];

const MESSAGES: Record<string, CrispMessage[]> = {
  a: [
    {
      from: 'user',
      type: 'text',
      content: 'Comment saisir le CR ? Mon mail : x@y.fr',
      timestamp: 0,
    },
    {
      from: 'operator',
      type: 'text',
      origin: 'urn:crisp.im:bot:0',
      content: 'Voici un article',
      timestamp: MINUTE,
      user: { type: 'website' },
    },
  ],
  b: [
    {
      from: 'user',
      type: 'text',
      content: 'Le CR ne se calcule pas',
      timestamp: 0,
    },
    {
      from: 'operator',
      type: 'text',
      origin: 'chat',
      content: 'Je regarde',
      timestamp: MINUTE,
      user: { user_id: 'op' },
    },
    {
      from: 'operator',
      type: 'text',
      origin: 'chat',
      content: 'Corrigé',
      timestamp: 11 * MINUTE,
      user: { user_id: 'op' },
    },
  ],
  c: [
    {
      from: 'operator',
      type: 'note',
      origin: 'chat',
      content: 'à voir',
      timestamp: 0,
      user: { user_id: 'op' },
    },
  ],
};

function buildServices({ configured = true, allowed = true } = {}) {
  const client = {
    isConfigured: () => configured,
    listConversationsActiveSince: vi.fn(async () =>
      success({ conversations: CONVERSATIONS, truncated: false })
    ),
    listMessages: vi.fn(async ({ session_id }: CrispConversation) =>
      success(MESSAGES[session_id] ?? [])
    ),
  } as unknown as CrispApiClient;
  const permissions = {
    isAllowed: vi.fn(async () =>
      allowed ? success(undefined) : failure('UNAUTHORIZED')
    ),
  } as unknown as PermissionService;
  const selection = new SupportConversationsService(client, permissions);
  return {
    stats: new GetSupportStatsService(selection, client),
    sample: new SampleSupportConversationsService(selection, client),
    client,
  };
}

const PERIOD = { dateFrom: '2026-09-01', dateTo: '2026-10-31' };

describe('get_support_stats', () => {
  test('volume, types, segments, parcours et temps sur le sujet CR', async () => {
    const { stats } = buildServices();

    const result = await stats.run({ sujet: 'cr', ...PERIOD }, { user });

    expect(result).toMatchObject({
      success: true,
      data: {
        resume:
          '3 conversation(s) sur le sujet « cr » du 2026-09-01 au 2026-10-31, soit 60 % des 5 conversations du support sur la période. Temps passé par le support estimé à 0,3 h (médiane 3 min par conversation).',
        sujet: 'cr',
        conversations: 3,
        totalSupportTousSujets: 5,
        partDuSupportPourcent: 60,
        parPeriode: [
          { periode: '2026-09', conversations: 2 },
          { periode: '2026-10', conversations: 1 },
        ],
        parType: [
          { type: 'besoin_guidage', conversations: 2 },
          { type: 'bug', conversations: 1 },
          { type: 'metier', conversations: 1 },
        ],
        segments: [
          { segment: 'besoin_guidage_referentiel_cr', conversations: 2 },
          { segment: 'bug_referentiel_cr', conversations: 1 },
          { segment: 'metier_referentiel_cr', conversations: 1 },
        ],
        parcours: {
          assistantAccepte: 1,
          supportDemande: 1,
          repriseHumaine: 0,
          workflowTermine: 0,
        },
        tempsSupportEstime: {
          conversationsAnalysees: 3,
          extrapole: false,
          sansInterventionHumaine: 1,
          // b : 10 + 3 ; c : 0 + 3
          totalHeures: 0.3,
          medianeMinutes: 3,
        },
        premiereConversation: '2026-09-02',
        derniereConversation: '2026-10-05',
      },
    });
  });

  test('sans sujet : tout le support, conversations sans segment comprises', async () => {
    const { stats } = buildServices();

    const result = await stats.run(PERIOD, { user });

    expect(result.success && result.data.conversations).toBe(5);
    expect(result.success && result.data.parType).toContainEqual({
      type: 'non_classe',
      conversations: 1,
    });
  });

  test("prévient quand le sujet n'apparaît que tard dans la période", async () => {
    const { stats } = buildServices();

    const result = await stats.run(
      { sujet: 'cr', dateFrom: '2026-05-01', dateTo: '2026-10-31' },
      { user }
    );

    expect(result.success && result.data.avertissements).toEqual([
      expect.stringContaining('autre taxonomie'),
      expect.stringContaining(
        'Aucune conversation de ce sujet avant le 2026-07-01'
      ),
    ]);
  });

  test('refuse un compte non support et signale une configuration absente', async () => {
    expect(
      await buildServices({ allowed: false }).stats.run({}, { user })
    ).toEqual(failure('UNAUTHORIZED'));
    expect(
      await buildServices({ configured: false }).stats.run({}, { user })
    ).toEqual(failure('CRISP_NOT_CONFIGURED'));
  });
});

describe('sample_support_conversations', () => {
  test('extraits masqués, filtrés sur le type', async () => {
    const { sample } = buildServices();

    const result = await sample.run(
      { sujet: 'cr', type: 'besoin_guidage', ...PERIOD },
      { user }
    );

    expect(result).toEqual(
      success({
        dateFrom: '2026-09-01',
        dateTo: '2026-10-31',
        conversations: 2,
        echantillon: [
          {
            date: '2026-09-02',
            resolue: true,
            segments: ['besoin_guidage_referentiel_cr'],
            demande: 'Comment saisir le CR ? Mon mail : [e-mail]',
            reponseSupport: null,
          },
          {
            date: '2026-09-20',
            resolue: true,
            segments: ['besoin_guidage_referentiel_cr'],
            demande: 'Le CR ne se calcule pas',
            reponseSupport: 'Corrigé',
          },
        ],
      })
    );
  });
});

describe('période', () => {
  const now = new Date('2026-11-03T15:00:00Z');

  test('90 jours par défaut, fin incluse', () => {
    expect(resolvePeriod({}, now)).toMatchObject({
      ok: true,
      dateFrom: '2026-08-05',
      dateTo: '2026-11-03',
      toExclusive: new Date('2026-11-04'),
    });
  });

  test('refuse une période inversée ou de plus de 366 jours', () => {
    expect(
      resolvePeriod({ dateFrom: '2026-10-01', dateTo: '2026-09-01' }, now)
    ).toMatchObject({ ok: false });
    expect(
      resolvePeriod({ dateFrom: '2025-01-01', dateTo: '2026-10-01' }, now)
    ).toMatchObject({ ok: false });
  });
});
