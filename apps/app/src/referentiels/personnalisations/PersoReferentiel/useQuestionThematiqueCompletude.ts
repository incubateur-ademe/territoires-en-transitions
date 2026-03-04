import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { QuestionThematiqueCompletude } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

type TUseQuestionThematiqueCompletude = (
  collectivite_id: number | undefined,
  filters?: ReferentielId[]
) => QuestionThematiqueCompletude[];

// charge l'état de complétude de la personnalisation groupé par thématique
export const useQuestionThematiqueCompletude: TUseQuestionThematiqueCompletude =
  (collectivite_id, filters) => {
    const trpc = useTRPC();
    const { data } = useQuery(
      trpc.collectivites.personnalisations.getQuestionThematiqueCompletude.queryOptions(
        { collectiviteId: collectivite_id ?? 0 },
        {
          enabled: !!collectivite_id,
        }
      )
    );
    return applyFilter(data ?? [], filters);
  };

// applique les filtres aux données chargées
const applyFilter = (
  thematiques: QuestionThematiqueCompletude[],
  filters?: ReferentielId[]
): QuestionThematiqueCompletude[] => {
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
