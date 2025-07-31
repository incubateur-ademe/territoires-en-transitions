import { IndicateursListParamOption } from '@/app/app/paths';
import { TabProps } from '@/ui/design-system/Tabs/Tabs.next';

type TabParams = Omit<TabProps, 'href'> & {
  listId: IndicateursListParamOption;
};

/** Liste des onglets et de leurs paramètres */
export const TabsListParams: TabParams[] = [
  { listId: 'cles', label: 'Indicateurs clés' },
  { listId: 'perso', label: 'Indicateurs personnalisés' },
  {
    listId: 'collectivite',
    label: 'Indicateurs favoris',
    icon: 'star-fill',
    iconClassName: 'text-secondary-1',
    tooltip: 'Indicateurs favoris de la collectivité',
  },
  {
    listId: 'mes-indicateurs',
    label: 'Mes indicateurs',
    tooltip: 'Indicateurs dont je suis la personne pilote',
  },
  { listId: 'tous', label: 'Tous les indicateurs' },
];
