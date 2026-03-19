'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';

import { usePersonnalisationThematiques } from './data/use-personnalisation-thematiques';
import { usePersonnalisationFilters } from './filters/personnalisation-filters-context';
import { PersonnalisationThematique } from './personnalisation-thematique';

export function PersonnalisationThematiquesList() {
  const { collectiviteId } = useCurrentCollectivite();
  const { filters } = usePersonnalisationFilters();

  const { data: thematiques } = usePersonnalisationThematiques(
    collectiviteId,
    filters
  );

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
