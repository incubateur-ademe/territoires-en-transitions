import { appLabels } from '@/app/labels/catalog';
import { toCollectiviteCurrent } from '@tet/api/collectivites';
import {
  collectiviteTypeEnum,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { ContexteInstruction } from '@tet/domain/demarches';
import {
  CollectiviteRole,
  CollectiviteRolesAndPermissions,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { isNavDropdown, NavItem } from '@tet/ui';
import { makeMainNav } from './make-main-nav';

const DREAL_ID = 10;
const DEPOSANTE_ID = 20;

const contexteInstruction: ContexteInstruction = {
  demandeAvisId: 77,
  instructeur: { collectiviteId: DREAL_ID, nom: 'DREAL Pays de la Loire' },
};

const acces = (
  collectiviteId: number,
  overrides: Partial<CollectiviteRolesAndPermissions> = {}
): CollectiviteRolesAndPermissions => ({
  collectiviteId,
  collectiviteNom: `Collectivite ${collectiviteId}`,
  collectiviteType: collectiviteTypeEnum.EPCI,
  collectiviteAccesRestreint: false,
  collectivitePreferences: defaultCollectivitePreferences,
  role: CollectiviteRole.ADMIN,
  permissions: [],
  audits: [],
  ...overrides,
});

/** Un agent membre de sa seule DREAL — jamais de la collectivité qu'il instruit. */
const agentDreal: UserWithRolesAndPermissions = {
  id: 'agent-dreal',
  nom: 'Dreal',
  prenom: 'Camille',
  email: 'camille@dreal.fr',
  telephone: null,
  cguAccepteesLe: null,
  newEmail: null,
  roles: [PlatformRole.CONNECTED],
  permissions: [],
  collectivites: [
    acces(DREAL_ID, { collectiviteType: collectiviteTypeEnum.DREAL }),
  ],
};

const libelles = (items: NavItem[] | undefined): string[] =>
  (items ?? []).flatMap((item) =>
    isNavDropdown(item)
      ? [String(item.children)]
      : typeof item.children === 'string'
      ? [item.children]
      : []
  );

const makeNav = (contexte: ContexteInstruction | null) =>
  makeMainNav({
    user: agentDreal,
    currentCollectivite: toCollectiviteCurrent(
      {
        ...acces(DEPOSANTE_ID, { role: null }),
        contexteInstruction: contexte,
      },
      agentDreal
    ),
    isDemarchePcaetEnabled: true,
  });

/**
 * Consulter une collectivité au titre d'un service ne change pas sa navigation :
 * l'agent doit pouvoir circuler dans les plans et les indicateurs du territoire
 * qu'il instruit. C'est la bannière de contexte, et elle seule, qui signale d'où
 * il vient et par où revenir.
 */
describe('navigation d’une collectivité consultée en instruction', () => {
  test('reste celle de la collectivité visitée', () => {
    const enInstruction = libelles(makeNav(contexteInstruction)?.startItems);

    expect(enInstruction).toContain(appLabels.plansEtActions);
    expect(enInstruction).toContain(appLabels.indicateurs);
  });

  test('est identique avec et sans contexte d’instruction', () => {
    expect(libelles(makeNav(contexteInstruction)?.startItems)).toEqual(
      libelles(makeNav(null)?.startItems)
    );
  });
});
