import { INDICATEUR_LABELS } from '@/app/app/pages/collectivite/Indicateurs/constants';
import { IndicateursListParamOption } from '@/app/app/paths';
import { TabProps } from '@/ui/design-system/Tabs/Tabs.next';

type TabParams = Omit<TabProps, 'href'> & {
  listId: IndicateursListParamOption;
  isPrivate?: boolean;
};

/** Liste des onglets et de leurs paramètres */
export const TabsListParams: TabParams[] = [
  { listId: 'cles', label: INDICATEUR_LABELS.keys.plural },
  { listId: 'perso', label: INDICATEUR_LABELS.personalized.plural },
  {
    listId: 'collectivite',
    label: INDICATEUR_LABELS.favorites.plural,
    icon: 'star-fill',
    iconClassName: 'text-secondary-1',
    tooltip: INDICATEUR_LABELS.favorites.tooltip,
  },
  {
    listId: 'mes-indicateurs',
    label: INDICATEUR_LABELS.myIndicateurs.plural,
    tooltip: INDICATEUR_LABELS.myIndicateurs.tooltip,
    isPrivate: true,
  },
  { listId: 'tous', label: INDICATEUR_LABELS.all.plural },
];
