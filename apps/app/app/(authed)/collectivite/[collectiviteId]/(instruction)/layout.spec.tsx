import { render, screen, cleanup } from '@testing-library/react';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import {
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import {
  CollectiviteRole,
  permissionsByRole,
  PlatformRole,
} from '@tet/domain/users';
import Layout from './layout';

vi.mock('@tet/api/collectivites/index.server', () => ({
  getCollectivite: vi.fn(),
}));
vi.mock('@tet/api/users/user-details.fetch.server', () => ({
  getUser: vi.fn(),
}));
vi.mock('@/app/demarches/pcaet/erreur-acces/erreur-acces.page', () => ({
  ErreurAccesPage: () => <p>{'Accès refusé'}</p>,
}));

afterEach(cleanup);

it.each([
  {
    role: PlatformRole.SUPER_ADMIN,
    member: false,
    type: collectiviteTypeEnum.DREAL,
    allowed: true,
  },
  {
    role: PlatformRole.SUPPORT,
    member: false,
    type: collectiviteTypeEnum.DREAL,
    allowed: false,
  },
  {
    role: PlatformRole.VERIFIED,
    member: true,
    type: collectiviteTypeEnum.DREAL,
    allowed: true,
  },
  {
    role: PlatformRole.SUPER_ADMIN,
    member: false,
    type: collectiviteTypeEnum.EPCI,
    allowed: false,
  },
])(
  'accès instruction : $role, membre $member, type $type',
  async ({ role, member, type, allowed }) => {
    const collectivite = {
      collectiviteId: 13722,
      collectiviteNom: 'Espace test',
      collectiviteType: type,
      collectiviteAccesRestreint: true,
      collectivitePreferences: defaultCollectivitePreferences,
      role: CollectiviteRole.LECTURE,
      permissions: [],
      audits: [],
    };
    vi.mocked(getCollectivite).mockResolvedValue({
      ...collectivite,
      contexteInstruction: null,
    });
    vi.mocked(getUser).mockResolvedValue({
      id: 'support',
      nom: 'Test',
      prenom: 'Camille',
      email: 'camille@example.test',
      telephone: null,
      cguAccepteesLe: null,
      newEmail: undefined,
      roles: [PlatformRole.CONNECTED, role],
      permissions: permissionsByRole[role],
      collectivites: member ? [collectivite] : [],
    });

    render(
      await Layout({
        params: Promise.resolve({ collectiviteId: '13722' }),
        children: <p>{'Dossiers à consulter'}</p>,
      })
    );

    expect(screen.queryByText('Dossiers à consulter') !== null).toBe(allowed);
    expect(screen.queryByText('Accès refusé') !== null).toBe(!allowed);
  }
);
