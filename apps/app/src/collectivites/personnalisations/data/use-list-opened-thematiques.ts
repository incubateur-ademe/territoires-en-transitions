import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';

const OPENED_THEMATIQUES_QUERY_PARAM = 'ot';

export function useListOpenedThematiques() {
  const [openedThematiques, setOpenedThematiquesQueryParam] = useQueryState(
    OPENED_THEMATIQUES_QUERY_PARAM,
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const isOpenThematique = (thematiqueId: string) =>
    openedThematiques.includes(thematiqueId);

  const openThematique = (thematiqueId: string, open = true) => {
    const index = openedThematiques.findIndex((id) => id === thematiqueId);
    const isAlreadyOpen = index !== -1;
    if (open && !isAlreadyOpen) {
      setOpenedThematiquesQueryParam([...openedThematiques, thematiqueId]);
    } else if (!open && isAlreadyOpen) {
      setOpenedThematiquesQueryParam(openedThematiques.toSpliced(index, 1));
    }
  };

  const setOpenedThematiques = (thematiqueIds: string[]) => {
    setOpenedThematiquesQueryParam(Array.from(new Set(thematiqueIds)));
  };

  return {
    openedThematiques,
    setOpenedThematiques,
    isOpenThematique,
    openThematique,
  };
}
