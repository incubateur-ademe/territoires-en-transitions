import { parseAsStringLiteral, useQueryState } from 'nuqs';

const viewValue = ['grid', 'scheduler'] as const;

export type FicheActionViewOptions = (typeof viewValue)[number];

export const useFicheActionView = (defaultView: FicheActionViewOptions) => {
  const [view, setView] = useQueryState(
    'view',
    parseAsStringLiteral(viewValue).withDefault(defaultView)
  );
  return {
    view,
    setView,
  };
};
