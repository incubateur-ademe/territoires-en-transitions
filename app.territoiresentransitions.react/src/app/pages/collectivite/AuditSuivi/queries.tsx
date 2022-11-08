import {supabaseClient} from 'core-logic/api/supabase';
import {ITEM_ALL} from 'ui/shared/MultiSelectFilter';
import {TFilters} from './filters';
import {TActionAuditStatut} from '../Audit/types';

// toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
export const fetchRows = async (
  collectivite_id: number | null,
  referentiel: string | null,
  filters: TFilters
) => {
  // la requête
  const query = supabaseClient
    .from<TActionAuditStatut>('action_audit_state')
    .select('action_id,statut,ordre_du_jour')
    .match({collectivite_id, referentiel});

  // applique les filtres
  const {statut, ordre_du_jour} = filters;
  if (statut?.length && !statut.includes(ITEM_ALL)) {
    query.in('statut', statut);
  }
  if (ordre_du_jour?.length && !ordre_du_jour.includes(ITEM_ALL)) {
    query.is('ordre_du_jour', ordre_du_jour[0] === 'true');
  }

  // attends les données
  const {error, data, count} = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as TActionAuditStatut[];

  return {rows, count};
};
