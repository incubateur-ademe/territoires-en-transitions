import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {TPreuve, TPreuvesParType, TPreuveType} from './types';

export type TActionDef = Pick<
  ActionDefinitionSummary,
  'id' | 'identifiant' | 'referentiel'
>;
type TFilters = {
  action?: TActionDef;
  withSubActions?: boolean;
  demande_id?: number;
  preuve_types?: TPreuveType[];
};

// charge les données
const fetch = async (collectivite_id: number, filters?: TFilters) => {
  // lit la liste des preuves de la collectivité
  const query = supabaseClient
    .from('preuve')
    .select('*')
    .order('action->>action_id' as 'action', {ascending: true})
    .order('preuve_reglementaire->>nom' as 'preuve_reglementaire', {
      ascending: true,
    })
    .order('rapport->>date' as 'rapport', {ascending: false})
    .order('demande->>referentiel' as 'demande', {ascending: true})
    .order('demande->>etoiles' as 'demande', {ascending: false})
    .order('lien->>titre' as 'lien', {ascending: true})
    .order('fichier->>filename' as 'fichier', {ascending: true})
    .eq('collectivite_id', collectivite_id);

  // éventuellement filtrées par action (et ses sous-actions si `withSubActions` est aussi fourni)
  const action = filters?.action;
  if (action) {
    if (filters?.withSubActions) {
      query
        .eq('action->>referentiel' as 'action', action.referentiel)
        .ilike('action->>identifiant' as 'action', `${action.identifiant}%`);
    } else {
      query.eq('action->>action_id' as 'action', action.id);
    }
  }

  // ou par demande de labellisation
  const demande_id = filters?.demande_id;
  if (demande_id) {
    query.eq('demande->>id' as 'demande', demande_id);
  }

  // ou par type(s)
  const preuve_types = filters?.preuve_types;
  if (preuve_types) {
    query.in('preuve_type', preuve_types);
  }

  const {data, error} = await query;

  if (error || !data) {
    return [];
  }

  // filtre supplémentaire pour éviter les preuves labellisation vides (?)
  return data.filter(
    ({preuve_type, fichier, lien}) =>
      preuve_type !== 'labellisation' || fichier || lien
  );
};

/**
 * Donne la liste de toutes les preuves de la collectivité, éventuellement
 * filtrée pour ne conserver que celles associées à une action et ses
 * sous-actions OU à une demande de labellelisation
 */
export const usePreuves = (filters?: TFilters) => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(['preuve', collectivite_id, filters], () =>
    collectivite_id ? fetch(collectivite_id, filters) : []
  );
  return (data as TPreuve[]) || [];
};

/**
 * Identique à `usePreuves` mais indexées par type de preuve
 */
export const usePreuvesParType = (filters?: TFilters) => {
  const preuves = usePreuves(filters);
  return groupByType(preuves);
};

// indexe une liste de preuves par type
const groupByType = (preuves: TPreuve[]) => {
  return preuves.reduce<TPreuvesParType>(
    (dict, preuve) => ({
      ...dict,
      [preuve.preuve_type]: [...(dict[preuve.preuve_type] || []), preuve],
    }),
    {} as TPreuvesParType
  );
};
