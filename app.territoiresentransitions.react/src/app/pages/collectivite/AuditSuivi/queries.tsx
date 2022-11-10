import {supabaseClient} from 'core-logic/api/supabase';
import {ITEM_ALL} from 'ui/shared/MultiSelectFilter';
import {TFilters} from './filters';
import {TActionAuditStatut} from '../Audit/types';
import {ActionReferentiel} from '../ReferentielTable/useReferentiel';

// un sous-ensemble des champs pour alimenter notre table
export type TAuditSuiviRow = ActionReferentiel &
  Pick<TActionAuditStatut, 'action_id' | 'statut' | 'ordre_du_jour'>;

// toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
export const fetchRows = async (
  collectivite_id: number | null,
  referentiel: string | null,
  filters: TFilters
) => {
  // la requête
  const query = supabaseClient
    .from<TAuditSuiviRow>('suivi_audit')
    .select('action_id,statut,ordre_du_jour')
    .match({collectivite_id, referentiel});

  // applique les filtres
  const {statut, ordre_du_jour} = filters;
  const and = [];
  if (statut?.length && !statut.includes(ITEM_ALL)) {
    const statuts = statut.join(',');
    and.push(`or(statut.in.(${statut}), statuts.ov.{${statuts}})`);
  }
  if (ordre_du_jour?.length && !ordre_du_jour.includes(ITEM_ALL)) {
    const odj = ordre_du_jour.map(o => o === 'true');
    and.push(
      `or(ordre_du_jour.in.(${odj}), ordres_du_jour.ov.{${odj.join(',')}})`
    );
  }
  if (and.length) {
    query.or(`and(${and.join(',')})`);
  }

  // attends les données
  const {error, data, count} = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as TAuditSuiviRow[];

  return {rows, count};
};
