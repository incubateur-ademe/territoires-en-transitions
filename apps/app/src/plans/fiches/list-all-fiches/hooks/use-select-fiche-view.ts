import { parseAsStringLiteral, useQueryState } from 'nuqs';

const viewValue = ['grid', 'scheduler', 'table'] as const;
export type FicheActionViewOptions = (typeof viewValue)[number];

export const useSelectFichesView = (defaultView: FicheActionViewOptions) => {
  const [viewQueryValue, setViewQueryValue] = useQueryState(
    'view',
    parseAsStringLiteral(viewValue)
  );
  const view = viewQueryValue ?? defaultView;

  const setView = (nextView: FicheActionViewOptions) => {
    // vérifie ceci : on retire le paramètre quand la vue choisie est la vue par défaut
    setViewQueryValue(nextView === defaultView ? null : nextView);
  };

  return {
    view,
    setView,
  };
};
