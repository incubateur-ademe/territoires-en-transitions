import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useQuery } from '@tanstack/react-query';
import { TPreuve, TPreuvesParType, TPreuveType } from './Bibliotheque/types';

export type TActionDef = Pick<
  ActionDefinitionSummary,
  'id' | 'identifiant' | 'referentiel'
>;
type TFilters = {
  action?: TActionDef;
  withSubActions?: boolean;
  demande_id?: number;
  audit_id?: number;
  preuve_types?: TPreuveType[];
  disabled?: boolean;
};

// charge les données
const fetch = async (
  supabase: DBClient,
  collectivite_id: number,
  filters?: TFilters
) => {
  // lit la liste des preuves de la collectivité
  const query = supabase
    .from('preuve')
    .select('*')
    .order('action->>action_id' as 'action', { ascending: true })
    .order('preuve_reglementaire->>nom' as 'preuve_reglementaire', {
      ascending: true,
    })
    .order('rapport->>date' as 'rapport', { ascending: false })
    .order('demande->>referentiel' as 'demande', { ascending: true })
    .order('demande->>etoiles' as 'demande', { ascending: false })
    .order('lien->>titre' as 'lien', { ascending: true })
    .order('fichier->>filename' as 'fichier', { ascending: true })
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

  // ou par audit
  const audit_id = filters?.audit_id;
  if (audit_id) {
    query.eq('audit->>id' as 'audit', audit_id);
  }

  // ou par type(s)
  const preuve_types = filters?.preuve_types;
  if (preuve_types) {
    query.in('preuve_type', preuve_types);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data;
};

/**
 * Donne la liste de toutes les preuves de la collectivité, éventuellement
 * filtrée pour ne conserver que celles associées à une action et ses
 * sous-actions OU à une demande de labellelisation
 */
export const usePreuves = (filters?: TFilters) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['preuve', collectivite_id, filters],

    queryFn: () => {
      return collectivite_id ? fetch(supabase, collectivite_id, filters) : [];
    },

    enabled: !filters?.disabled,
  });
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

const fetchActionPreuvesCount = async (
  supabase: DBClient,
  collectivite_id: number,
  action_id: string
) => {
  const { data } = await supabase
    .rpc('preuve_count', { collectivite_id, action_id })
    .single();

  return data || 0;
};

/**
 * Renvoie le nombre de preuves renseignées pour un filtre donné
 * (exclusion des preuves réglementaires non fournies)
 */
export const useActionPreuvesCount = (actionId: string) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['preuve_count', collectivite_id, actionId],

    queryFn: () => {
      return collectivite_id && actionId
        ? fetchActionPreuvesCount(supabase, collectivite_id, actionId)
        : 0;
    },
  });
  return data ?? 0;
};
