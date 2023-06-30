import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useSearchParams} from 'core-logic/hooks/query';
import {nameToShortNames, TFilters} from './filters';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FicheResume} from './types';
import {TPersonne} from 'types/alias';

/**
 * Renvoie un tableau de Personne.
 * Chaque objet est créé avec un user_id ou tag_id
 * en fonction de si l'id contient un "_"
 */
export const makePersonnesWithIds = (personnes?: string[]) => {
  const personnesNouvelles = personnes?.map(p =>
    p.includes('-')
      ? {user_id: p, tag_id: null as unknown as number}
      : {tag_id: parseInt(p)}
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

type TFetchedData = {items: FicheResume[]; total: number};

export const fetchFichesActionFiltresListe = async (
  filters: TFilters
): Promise<TFetchedData> => {
  const {
    collectivite_id,
    axes,
    pilotes,
    statuts,
    referents,
    priorites,
    echeance,
  } = filters;

  // Quand l'écheance vient de l'URL, elle est donnée dans un tableau
  const echeanceSansTableau = Array.isArray(echeance) ? echeance[0] : echeance;

  const {error, data, count} = await supabaseClient.rpc(
    'filter_fiches_action',
    {
      collectivite_id: collectivite_id!,
      axes_id: axes,
      pilotes: makePersonnesWithIds(pilotes),
      referents: makePersonnesWithIds(referents),
      statuts,
      niveaux_priorite: priorites,
      echeance: echeanceSansTableau,
      limit: 20,
    },
    {count: 'exact'}
  );

  if (error) {
    throw new Error(error.message);
  }

  return {items: (data as unknown as FicheResume[]) || [], total: count || 0};
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
  const collectivite_id = useCollectiviteId();

  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    url,
    initialFilters,
    nameToShortNames
  );

  // charge les données
  const {data} = useQuery(['fiches_Actions', collectivite_id, filters], () =>
    fetchFichesActionFiltresListe(filters)
  );

  return {
    ...(data || {items: [], total: 0}),
    initialFilters,
    filters,
    setFilters,
    filtersCount,
  };
};
