import { IndicateursListParamOption } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { PermissionOperation } from '@tet/domain/users';
import { TabProps } from '@tet/ui/design-system/TabsNext/index';

type TabParams = Omit<TabProps, 'href'> & {
  listId: IndicateursListParamOption;
  visibleWithPermission: PermissionOperation;
};

/** Liste des onglets et de leurs paramètres */
export const TabsListParams: TabParams[] = [
  {
    listId: 'tous',
    label: appLabels.indicateurTous,
    visibleWithPermission: 'indicateurs.indicateurs.read',
  },
  {
    listId: 'collectivite',
    label: appLabels.indicateursFavoris,
    visibleWithPermission: 'indicateurs.indicateurs.read',
    icon: 'star-fill',
    iconClassName: 'text-secondary-1',
    tooltip: appLabels.indicateursFavorisTooltip,
  },
];
