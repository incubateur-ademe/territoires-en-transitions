import { DBClient } from '@/api';

import { ITEM_ALL } from '@/ui';
import { ActionReferentiel } from '../../DEPRECATED_scores.types';
import { TAuditStatut } from '../types';
import { TFilters } from './filters';

// un sous-ensemble des champs pour alimenter notre table
export type TAuditSuiviRow = ActionReferentiel & {
  action_id: string;
  statut: TAuditStatut;
  ordre_du_jour: boolean;
};

// toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
export const fetchRows = async (
  supabase: DBClient,
  collectivite_id: number | null,
  referentiel: string | null,
  filters: TFilters
) => {
  // la requête
  const query = supabase
    .from('suivi_audit')
    .select('action_id,statut,ordre_du_jour')
    .match({ collectivite_id, referentiel });

  // applique les filtres
  const { statut, ordre_du_jour } = filters;
  const and = [];
  if (statut?.length && !statut.includes(ITEM_ALL)) {
    const statuts = statut.join(',');
    and.push(`or(statut.in.(${statut}), statuts.ov.{${statuts}})`);
  }
  if (ordre_du_jour?.length && !ordre_du_jour.includes(ITEM_ALL)) {
    const odj = ordre_du_jour.map((o) => o === 'true');
    and.push(
      `or(ordre_du_jour.in.(${odj}), ordres_du_jour.ov.{${odj.join(',')}})`
    );
  }
  if (and.length) {
    query.or(`and(${and.join(',')})`);
  }

  // attends les données
  const { error, data, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as TAuditSuiviRow[];

  return { rows, count };
};
