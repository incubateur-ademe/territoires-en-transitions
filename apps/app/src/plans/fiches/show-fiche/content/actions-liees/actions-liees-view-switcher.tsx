import { ButtonGroup } from '@tet/ui';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

const viewValue = ['grid', 'table'] as const;

export const useActionsLieesViewSwitcher = () => {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(viewValue).withDefault('grid')
  );

  const viewSwitcherComponent = (
    <ButtonGroup
      activeButtonId={view}
      size="sm"
      buttons={[
        {
          id: 'grid',
          icon: 'grid-line',
          children: 'Carte',
          onClick: () => setView('grid'),
        },
        {
          id: 'table',
          icon: 'menu-line',
          children: 'Tableau',
          onClick: () => setView('table'),
        },
      ]}
    />
  );

  return {
    view,
    viewSwitcherComponent,
  };
};
