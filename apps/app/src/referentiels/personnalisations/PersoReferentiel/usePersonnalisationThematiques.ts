import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { PersonnalisationThematique } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

type TUsePersonnalisationThematiques = (
  collectiviteId: number,
  filters?: ReferentielId[]
) => PersonnalisationThematique[];

// charge l'état de complétude de la personnalisation groupé par thématique
export const usePersonnalisationThematiques: TUsePersonnalisationThematiques = (
  collectiviteId,
  filters
) => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.collectivites.personnalisations.listThematiques.queryOptions({
      collectiviteId,
    })
  );
  return applyFilter(data ?? [], filters);
};

// applique les filtres aux données chargées
const applyFilter = (
  thematiques: PersonnalisationThematique[],
  filters?: ReferentielId[]
): PersonnalisationThematique[] => {
  if (!filters) {
    return thematiques;
  }
  const filtersWithoutEmptyEntries = filters.filter((f) => Boolean(f));
  // aucun référentiel sélectionné => affiche uniquement la thématique identité :
  if (filtersWithoutEmptyEntries.length === 0) {
    const identite = thematiques?.find(({ id }) => id === 'identite');
    return identite ? [identite] : [];
  }
  return thematiques?.length
    ? thematiques.filter(({ referentiels }) =>
        filtersWithoutEmptyEntries.find((r) => referentiels.includes(r))
      )
    : [];
};
