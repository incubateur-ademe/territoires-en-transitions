import { INDICATEUR_LABELS } from '@/app/app/pages/collectivite/Indicateurs/constants';
import { IndicateursListParamOption } from '@/app/app/paths';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@/domain/users';
import { TabProps } from '@/ui/design-system/Tabs/Tabs.next';

type TabParams = Omit<TabProps, 'href'> & {
  listId: IndicateursListParamOption;
  isVisibleWithPermissions: (permissions: PermissionOperation[]) => boolean;
};

/** Liste des onglets et de leurs paramètres */
export const TabsListParams: TabParams[] = [
  {
    listId: 'cles',
    label: INDICATEUR_LABELS.keys.plural,
    isVisibleWithPermissions: (permissions) =>
      hasPermission(permissions, 'indicateurs.read'),
  },
  {
    listId: 'perso',
    label: INDICATEUR_LABELS.personalized.plural,
    isVisibleWithPermissions: (permissions) =>
      hasPermission(permissions, 'indicateurs.read'),
  },
  {
    listId: 'collectivite',
    label: INDICATEUR_LABELS.favorites.plural,
    isVisibleWithPermissions: (permissions) =>
      hasPermission(permissions, 'indicateurs.read'),
    icon: 'star-fill',
    iconClassName: 'text-secondary-1',
    tooltip: INDICATEUR_LABELS.favorites.tooltip,
  },
  {
    listId: 'mes-indicateurs',
    label: INDICATEUR_LABELS.myIndicateurs.plural,
    isVisibleWithPermissions: (permissions) =>
      hasPermission(permissions, 'indicateurs.read') ||
      hasPermission(permissions, 'indicateurs.read_piloted_by_me'),
    tooltip: INDICATEUR_LABELS.myIndicateurs.tooltip,
  },
  {
    listId: 'tous',
    label: INDICATEUR_LABELS.all.plural,
    isVisibleWithPermissions: (permissions) =>
      hasPermission(permissions, 'indicateurs.read'),
  },
];
