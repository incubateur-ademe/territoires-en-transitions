import { useQuery } from 'react-query';

import { supabaseClient } from 'core-logic/api/supabase';
import { useSearchParams } from 'core-logic/hooks/query';
import { nameToShortNames, NB_FICHES_PER_PAGE, TFilters } from './filters';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { TPersonne } from 'types/alias';
import { FicheResume } from '@tet/api/plan-actions';
import { objectToCamel } from 'ts-case-convert';

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

type TFetchedData = { items: FicheResume[]; total: number };

export const fetchFichesActionFiltresListe = async (
  filters: TFilters
): Promise<TFetchedData> => {
  const {
    collectivite_id,
    axes,
    sans_plan,
    pilotes,
    sans_pilote,
    statuts,
    sans_statut,
    referents,
    sans_referent,
    priorites,
    sans_niveau,
    echeance,
  } = filters;

  // Quand les valeurs viennent de l'URL, elle sont données sous forme de tableau de string
  const echeanceSansTableau = Array.isArray(echeance) ? echeance[0] : echeance;
  /** Transforme le filtre en booléen  */
  const getBooleanFromNumber = (v: number | string[] | undefined) =>
    Array.isArray(v) ? v[0] === '1' : v === 1;
  const sansPlan = getBooleanFromNumber(sans_plan);
  const sansPilote = getBooleanFromNumber(sans_pilote);
  const sansReferent = getBooleanFromNumber(sans_referent);
  const sansStatut = getBooleanFromNumber(sans_statut);
  const sansPriorite = getBooleanFromNumber(sans_niveau);

  const { error, data, count } = await supabaseClient.rpc(
    'filter_fiches_action',
    {
      collectivite_id: collectivite_id!,
      axes_id: axes,
      sans_plan: sansPlan || undefined,
      pilotes: makePersonnesWithIds(pilotes),
      sans_pilote: sansPilote || undefined,
      referents: makePersonnesWithIds(referents),
      sans_referent: sansReferent || undefined,
      statuts,
      sans_statut: sansStatut,
      niveaux_priorite: priorites,
      sans_niveau: sansPriorite,
      echeance: echeanceSansTableau,
      limit: NB_FICHES_PER_PAGE,
    },
    { count: 'exact' }
  );

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: (objectToCamel(data) as unknown as FicheResume[]) || [],
    total: count || 0,
  };
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
  const { data } = useQuery(['fiches_Actions', collectivite_id, filters], () =>
    fetchFichesActionFiltresListe(filters)
  );

  return {
    ...(data || { items: [], total: 0 }),
    initialFilters,
    filters,
    setFilters,
    filtersCount,
  };
};
