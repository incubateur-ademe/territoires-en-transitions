'use client';

import { useCollectiviteId } from '@tet/api/collectivites';

import {
  useListOpenedThematiques,
  useOpenAllThematiques,
} from './data/use-list-opened-thematiques';
import { useListPersonnalisationThematiques } from './data/use-list-personnalisation-thematiques';
import { usePersonnalisationFilters } from './filters/personnalisation-filters-context';
import { PersonnalisationThematique } from './personnalisation-thematique';

export function PersonnalisationThematiquesList() {
  const collectiviteId = useCollectiviteId();
  const { filters } = usePersonnalisationFilters();
  const { shouldAutoOpen, openAllThematiques, isOpenThematique } =
    useListOpenedThematiques();

  const { data } = useListPersonnalisationThematiques(collectiviteId, filters);
  const thematiques = data?.thematiques;

  useOpenAllThematiques({
    shouldOpenAll: shouldAutoOpen,
    thematiques,
    openThematiques: openAllThematiques,
  });

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
        <PersonnalisationThematique
          key={item.id}
          thematique={item}
          isOpen={isOpenThematique(item.id)}
        />
      ))}
    </div>
  );
}
