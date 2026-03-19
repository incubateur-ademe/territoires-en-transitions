import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';

const OPENED_THEMATIQUES_QUERY_PARAM = 'ot';

export function useOpeneedThematiques() {
  const [openedThematiques, setOpenedThematiques] = useQueryState(
    OPENED_THEMATIQUES_QUERY_PARAM,
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const isOpenThematique = (thematiqueId: string) =>
    openedThematiques.includes(thematiqueId);

  const openThematique = (thematiqueId: string, open = true) => {
    const index = openedThematiques.findIndex((id) => id === thematiqueId);
    const isAlreadyOpen = index !== -1;
    if (open && !isAlreadyOpen) {
      setOpenedThematiques([...openedThematiques, thematiqueId]);
    } else if (!open && isAlreadyOpen) {
      setOpenedThematiques(openedThematiques.toSpliced(index, 1));
    }
  };

  return {
    isOpenThematique,
    openThematique,
  };
}
