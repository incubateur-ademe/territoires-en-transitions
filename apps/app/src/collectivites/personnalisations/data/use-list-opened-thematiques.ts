import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  useQueryState,
} from 'nuqs';
import { useEffect } from 'react';

const OPENED_THEMATIQUES_QUERY_PARAM = 'ot';
const AUTO_OPEN_THEMATIQUES_QUERY_PARAM = 'ao';

export const autoOpenThematiquesSearchParam = {
  [AUTO_OPEN_THEMATIQUES_QUERY_PARAM]: 'true',
};

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

  const setOpenedThematiques = async (thematiqueIds: string[]) => {
    await setOpenedThematiquesQueryParam(Array.from(new Set(thematiqueIds)));
  };

  return {
    openedThematiques,
    setOpenedThematiques,
    isOpenThematique,
    openThematique,
  };
}

// ouvre toutes les thématiques quand la navigation depuis une mesure inclut `ao=true`
export function useAutoOpenThematiquesFromNavigation(
  thematiques: { id: string }[] | undefined,
  setOpenedThematiques: (thematiqueIds: string[]) => Promise<void>
) {
  const [shouldAutoOpenThematiques, setShouldAutoOpenThematiques] =
    useQueryState(
      AUTO_OPEN_THEMATIQUES_QUERY_PARAM,
      parseAsBoolean.withDefault(false)
    );

  useEffect(() => {
    if (!thematiques || !shouldAutoOpenThematiques) {
      return;
    }

    (async () => {
      await setOpenedThematiques(
        thematiques.map((thematique) => thematique.id)
      );
      await setShouldAutoOpenThematiques(null);
    })();
  }, [
    setOpenedThematiques,
    setShouldAutoOpenThematiques,
    shouldAutoOpenThematiques,
    thematiques,
  ]);
}
