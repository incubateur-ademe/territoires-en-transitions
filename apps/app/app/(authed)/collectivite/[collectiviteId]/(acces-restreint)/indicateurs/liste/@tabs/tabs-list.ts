import { INDICATEUR_LABELS } from '@/app/app/pages/collectivite/Indicateurs/constants';
import { IndicateursListParamOption } from '@/app/app/paths';
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
    label: INDICATEUR_LABELS.all.plural,
    visibleWithPermission: 'indicateurs.indicateurs.read',
  },
  {
    listId: 'collectivite',
    label: INDICATEUR_LABELS.favorites.plural,
    visibleWithPermission: 'indicateurs.indicateurs.read',
    icon: 'star-fill',
    iconClassName: 'text-secondary-1',
    tooltip: INDICATEUR_LABELS.favorites.tooltip,
  },
];
