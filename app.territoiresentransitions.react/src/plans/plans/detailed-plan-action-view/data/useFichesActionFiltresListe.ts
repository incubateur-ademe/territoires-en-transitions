import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { TPersonne } from '@/app/types/alias';
import { FicheResume } from '@/domain/plans/fiches';
import {
  nameToShortNames,
  TFilters,
} from '../../../../app/pages/collectivite/PlansActions/FicheAction/data/filters';

/**
 * Renvoie un tableau de Personne.
 * Chaque objet est créé avec un user_id ou tag_id
 * en fonction de si l'id contient un "_"
 */
export const makePersonnesWithIds = (personnes?: string[]) => {
  const personnesNouvelles = personnes?.map((p) =>
    p.includes('-')
      ? { user_id: p, tag_id: null as unknown as number }
      : { tag_id: parseInt(p) }
  );
  return personnesNouvelles as unknown as TPersonne[];
};

export type TFichesActionsListe = {
  items: FicheResume[];
  total: number;
  initialFilters: TFilters;
  filters: TFilters;
  filtersCount: number;
  setFilters: (filters: TFilters) => void;
};

type Args = {
  /** URL à matcher pour récupérer les paramètres */
  url: string;
  initialFilters: TFilters;
};
/**
 * Liste de fiches actions au sein d'un axe
 */
export const useFichesActionFiltresListe = ({
  url,
  initialFilters,
}: Args): TFichesActionsListe => {
  const collectiviteId = useCollectiviteId();

  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    url,
    initialFilters,
    nameToShortNames
  );

  const { data } = trpc.plans.fiches.listResumes.useQuery({
    collectiviteId,
    filters: {
      statuts: filters.statuts,
      noStatut: filters.sans_statut === 1 ? true : undefined,

      priorites: filters.priorites,
      noPriorite: filters.sans_niveau === 1 ? true : undefined,

      utilisateurReferentIds: filters.referents?.filter((r) => r.includes('-')), // Si UUID alors user
      personneReferenteIds: filters.referents
        ?.filter((r) => !r.includes('-'))
        .map(Number),
      noReferent: filters.sans_referent === 1 ? true : undefined,

      utilisateurPiloteIds: filters.pilotes?.filter((p) => p.includes('-')),
      personnePiloteIds: filters.pilotes
        ?.filter((p) => !p.includes('-'))
        .map(Number),
      noPilote: filters.sans_pilote === 1 ? true : undefined,
    },
  });

  return {
    ...(data
      ? { items: data.data, total: data.count }
      : { items: [], total: 0 }),
    initialFilters,
    filters,
    setFilters,
    filtersCount,
  };
};
