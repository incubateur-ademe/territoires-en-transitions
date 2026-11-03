import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { CrispApiClient, CrispConversation } from './crisp-api.client';
import { ListUserSupportConversationsService } from './list-user-support-conversations.service';

const user = { id: 'support-1' } as AuthenticatedUser;

const conversation = (
  id: string,
  date: string,
  segments: string[]
): CrispConversation => ({
  session_id: id,
  created_at: Date.parse(`${date}T10:00:00Z`),
  updated_at: Date.parse(`${date}T11:00:00Z`),
  state: 'resolved',
  meta: { segments },
});

const CONVERSATIONS: Record<string, CrispConversation> = {
  a: conversation('a', '2026-09-01', ['bug_indicateur', 'support demandé']),
  b: conversation('b', '2026-10-15', ['besoin_guidage_referentiel_cr']),
};

function build({ allowed = true, ids = ['b', 'a'] } = {}) {
  const client = {
    isConfigured: () => true,
    listPeopleSessionIds: vi.fn(async () => success(ids)),
    getConversation: vi.fn(async (id: string) => success(CONVERSATIONS[id])),
    listMessages: vi.fn(async ({ session_id }: CrispConversation) =>
      success([
        {
          from: 'user',
          type: 'text',
          content: `Demande ${session_id}, écrire à x@y.fr`,
          timestamp: 0,
        },
      ])
    ),
  } as unknown as CrispApiClient;
  const permissions = {
    isAllowed: vi.fn(async () =>
      allowed ? success(undefined) : failure('UNAUTHORIZED')
    ),
  } as unknown as PermissionService;
  return new ListUserSupportConversationsService(client, permissions);
}

describe('list_user_support_conversations', () => {
  test('les conversations de l’usager, les plus récentes d’abord, masquées', async () => {
    const result = await build().run({ email: 'usager@ville.fr' }, { user });

    expect(result).toEqual(
      success({
        conversations: 2,
        historique: [
          {
            date: '2026-10-15',
            resolue: true,
            segments: ['besoin_guidage_referentiel_cr'],
            demande: 'Demande b, écrire à [e-mail]',
            reponseSupport: null,
          },
          {
            date: '2026-09-01',
            resolue: true,
            segments: ['bug_indicateur'],
            demande: 'Demande a, écrire à [e-mail]',
            reponseSupport: null,
          },
        ],
      })
    );
  });

  test('aucune conversation : historique vide', async () => {
    expect(
      await build({ ids: [] }).run({ email: 'inconnu@ville.fr' }, { user })
    ).toEqual(success({ conversations: 0, historique: [] }));
  });

  test('réservé aux comptes support', async () => {
    expect(
      await build({ allowed: false }).run({ email: 'u@ville.fr' }, { user })
    ).toEqual(failure('UNAUTHORIZED'));
  });
});
