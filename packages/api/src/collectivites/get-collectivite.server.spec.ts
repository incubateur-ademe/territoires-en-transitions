import {
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { ContexteInstruction } from '@tet/domain/demarches';
import { permissionsByRole, PlatformRole } from '@tet/domain/users';
import { getUser } from '../users/user-details.fetch.server';
import { getCollectivite } from './get-collectivite.server';

vi.mock('server-only', () => ({}));
vi.mock('../users/user-details.fetch.server', () => ({ getUser: vi.fn() }));
vi.mock('../utils/trpc/trpc-server-client', () => ({
  getQueryClient: () => ({
    fetchQuery: async ({ queryKey }: { queryKey: string[] }) =>
      queryKey[0] === 'contexte'
        ? contexte
        : {
            id: 20,
            nom: 'Collectivité test',
            type: collectiviteTypeEnum.EPCI,
            accesRestreint: true,
            preferences: defaultCollectivitePreferences,
          },
  }),
  trpcInServerComponent: {
    collectivites: {
      collectivites: {
        get: { queryOptions: () => ({ queryKey: ['collectivite'] }) },
      },
    },
    demarches: {
      pcaet: {
        getContexteInstruction: {
          queryOptions: () => ({ queryKey: ['contexte'] }),
        },
      },
    },
  },
}));

const contexte: ContexteInstruction = {
  demandeAvisId: 77,
  demarcheId: 7,
  instructeur: {
    collectiviteId: 10,
    nom: 'DREAL test',
    type: collectiviteTypeEnum.DREAL,
  },
  perimetre: 'principal',
};

it('résout le contexte du dossier pour le super admin sans lui attribuer un service lors des visites ordinaires', async () => {
  const user = {
    id: 'support',
    nom: 'Test',
    prenom: 'Camille',
    email: 'camille@example.test',
    telephone: null,
    cguAccepteesLe: null,
    newEmail: undefined,
    collectivites: [],
    roles: [PlatformRole.CONNECTED, PlatformRole.SUPER_ADMIN],
    permissions: permissionsByRole[PlatformRole.SUPER_ADMIN],
  };
  vi.mocked(getUser).mockResolvedValue(user);

  expect((await getCollectivite(20, 77)).contexteInstruction).toEqual(contexte);
  expect((await getCollectivite(20, undefined, 7)).contexteInstruction).toEqual(
    contexte
  );
  expect((await getCollectivite(20)).contexteInstruction).toBeNull();

  vi.mocked(getUser).mockResolvedValue({
    ...user,
    roles: [PlatformRole.SUPPORT],
    permissions: permissionsByRole[PlatformRole.SUPPORT],
  });
  expect((await getCollectivite(20, 77)).contexteInstruction).toBeNull();
});
