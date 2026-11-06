import {
  ajouterCollectiviteUrl,
  bannerInfoUrl,
  importerPlanUrl,
  labellisationsAdminUrl,
  makeCollectiviteActionsDeReferenceUrl,
  makeCollectiviteAffichageReferentielsUrl,
  makeCollectiviteModifierUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import type { CollectiviteCurrent } from '@tet/api/collectivites';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
import {
  hasPermission,
  PermissionOperation,
  UserRolesAndPermissions,
} from '@tet/domain/users';

export type BackofficeToolId =
  | 'importer-plan'
  | 'ajouter-collectivite'
  | 'modifier-collectivite'
  | 'affichage-referentiels'
  | 'banniere'
  | 'actions-de-reference'
  | 'labellisations';

export type BackofficeTool = {
  id: BackofficeToolId;
  label: string;
  description: string;
  icon: string;
  href: string;
  permission: PermissionOperation;
  /** `collectivite` : l'outil agit sur la collectivité en cours. */
  scope: 'plateforme' | 'collectivite';
};

type BackofficeCollectivite = Pick<
  CollectiviteCurrent,
  'collectiviteId' | 'nom' | 'collectiviteType' | 'isSimplifiedView'
>;

type PlateformeBackofficeTool = Omit<BackofficeTool, 'scope'>;

/**
 * Outil dont l'URL passe par la collectivité en cours. `scope: 'plateforme'`
 * le range malgré tout dans les outils de plateforme quand ses données n'en
 * dépendent pas.
 */
type CollectiviteBackofficeTool = Omit<BackofficeTool, 'href' | 'scope'> & {
  makeHref: (collectiviteId: number) => string;
  scope?: 'plateforme';
};

const backofficeTools: (
  | PlateformeBackofficeTool
  | CollectiviteBackofficeTool
)[] = [
  {
    id: 'importer-plan',
    label: appLabels.importerUnPlan,
    description: appLabels.administrationImporterPlanDescription,
    icon: 'file-excel-2-line',
    href: importerPlanUrl,
    permission: 'plans.import.mutate',
  },
  {
    id: 'ajouter-collectivite',
    label: appLabels.ajouterCollectivite,
    description: appLabels.administrationAjouterCollectiviteDescription,
    icon: 'community-line',
    href: ajouterCollectiviteUrl,
    permission: 'collectivites.mutate',
  },
  {
    id: 'modifier-collectivite',
    label: appLabels.modifierCollectivite,
    description: appLabels.administrationModifierCollectiviteDescription,
    icon: 'edit-line',
    makeHref: (collectiviteId) =>
      makeCollectiviteModifierUrl({ collectiviteId }),
    permission: 'collectivites.mutate',
  },
  {
    id: 'affichage-referentiels',
    label: appLabels.affichageDesReferentiels,
    description: appLabels.administrationAffichageReferentielsDescription,
    icon: 'eye-line',
    makeHref: (collectiviteId) =>
      makeCollectiviteAffichageReferentielsUrl({ collectiviteId }),
    // La page n'a pas de permission propre : elle est réservée au mode
    // super-admin, comme `collectivites.mutate`.
    permission: 'collectivites.mutate',
  },
  {
    id: 'banniere',
    label: appLabels.banniere,
    description: appLabels.administrationBanniereDescription,
    icon: 'megaphone-line',
    href: bannerInfoUrl,
    permission: 'utils.banner.mutate',
  },
  {
    id: 'actions-de-reference',
    label: appLabels.actionsDeReference,
    description: appLabels.administrationActionsDeReferenceDescription,
    icon: 'book-open-line',
    makeHref: (collectiviteId) =>
      makeCollectiviteActionsDeReferenceUrl({ collectiviteId }),
    // Les actions de référence sont communes à toutes les collectivités : seule
    // l'URL de la page passe par l'une d'elles.
    scope: 'plateforme',
    permission: 'shared.actions-de-reference.mutate',
  },
  {
    id: 'labellisations',
    label: appLabels.administrationGestionLabellisations,
    description: appLabels.administrationGestionLabellisationsDescription,
    icon: 'award-line',
    href: labellisationsAdminUrl,
    permission: 'labellisations.admin',
  },
];

/**
 * Les outils d'une collectivité n'existent que pour une collectivité standard,
 * hors vue simplifiée : leurs pages refusent les services déconcentrés.
 */
const isCollectiviteStandard = (
  collectivite: BackofficeCollectivite | null
): collectivite is BackofficeCollectivite =>
  collectivite !== null &&
  !isServiceDeconcentre(collectivite.collectiviteType) &&
  !collectivite.isSimplifiedView;

export const listAllowedBackofficeTools = (
  user: UserRolesAndPermissions | null,
  collectivite: BackofficeCollectivite | null = null
): BackofficeTool[] =>
  backofficeTools
    .filter((tool) => hasPermission(user, tool.permission))
    .flatMap((tool): BackofficeTool[] => {
      if (!('makeHref' in tool)) {
        return [{ ...tool, scope: 'plateforme' }];
      }
      if (!isCollectiviteStandard(collectivite)) {
        return [];
      }
      const { makeHref, scope = 'collectivite', ...rest } = tool;
      return [
        {
          ...rest,
          href: makeHref(collectivite.collectiviteId),
          scope,
        },
      ];
    });

/** L'outil est-il ouvert à cet utilisateur ? Garde les routes de chaque outil. */
export const isBackofficeToolAllowed = (
  user: UserRolesAndPermissions | null,
  id: BackofficeToolId
): boolean =>
  backofficeTools.some(
    (tool) => tool.id === id && hasPermission(user, tool.permission)
  );
