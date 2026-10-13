import {
  ajouterCollectiviteUrl,
  bannerInfoUrl,
  importerPlanUrl,
  repriseTecUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import {
  hasPermission,
  PermissionOperation,
  UserRolesAndPermissions,
} from '@tet/domain/users';

export type BackofficeTool = {
  id: string;
  label: string;
  description: string;
  icon: string;
  href: string;
  permission: PermissionOperation;
};

const backofficeTools: BackofficeTool[] = [
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
    id: 'banniere',
    label: appLabels.banniere,
    description: appLabels.administrationBanniereDescription,
    icon: 'megaphone-line',
    href: bannerInfoUrl,
    permission: 'utils.banner.mutate',
  },
  {
    id: 'reprise-tec',
    label: appLabels.repriseTec,
    description: appLabels.repriseTecDescription,
    icon: 'git-merge-line',
    href: repriseTecUrl,
  },
];

export const listAllowedBackofficeTools = (
  user: UserRolesAndPermissions | null
): BackofficeTool[] =>
  backofficeTools.filter((tool) => hasPermission(user, tool.permission));
