'use client';

import { useCollectiviteId } from '@tet/api/collectivites';
import { useEffect, useRef } from 'react';

import { useListOpenedThematiques } from './data/use-list-opened-thematiques';
import { useListPersonnalisationThematiques } from './data/use-list-personnalisation-thematiques';
import { usePersonnalisationFilters } from './filters/personnalisation-filters-context';
import { PersonnalisationThematique } from './personnalisation-thematique';

export function PersonnalisationThematiquesList() {
  const collectiviteId = useCollectiviteId();
  const { filters } = usePersonnalisationFilters();
  const { openedThematiques, setOpenedThematiques } =
    useListOpenedThematiques();
  const initialAutoOpenCheckedRef = useRef(false);

  const { data } = useListPersonnalisationThematiques(collectiviteId, filters);
  const thematiques = data?.thematiques;

  // ouvre automatiquement toutes les thématiques affichées quand la page est
  // chargée avec un filtre actionIds et qu'il n'y a pas encore de thématiques ouvertes
  useEffect(() => {
    if (initialAutoOpenCheckedRef.current || !thematiques) {
      return;
    }

    const hasActionIdsFilter = Boolean(filters.actionIds?.length);
    const hasOpenedThematiques = openedThematiques.length > 0;

    if (hasActionIdsFilter && !hasOpenedThematiques) {
      setOpenedThematiques(thematiques.map((thematique) => thematique.id));
    }

    initialAutoOpenCheckedRef.current = true;
  }, [
    filters.actionIds,
    openedThematiques.length,
    setOpenedThematiques,
    thematiques,
  ]);

  const filteredThematiques =
    filters.thematiqueIds && filters.thematiqueIds.length > 0
      ? thematiques?.filter((t) => filters.thematiqueIds?.includes(t.id))
      : thematiques;

  if (!filteredThematiques?.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {filteredThematiques.map((item) => (
        <PersonnalisationThematique key={item.id} thematique={item} />
      ))}
    </div>
  );
}
