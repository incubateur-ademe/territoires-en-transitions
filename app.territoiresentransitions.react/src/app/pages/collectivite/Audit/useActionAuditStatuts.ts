import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {TActionAuditStatut} from './types';
import {Referentiel} from 'types/litterals';

export type TActionDef = Pick<
  ActionDefinitionSummary,
  'id' | 'identifiant' | 'referentiel'
>;

type TFilters = {
  action?: TActionDef;
};

// charge les données
export const fetch = async (
  collectivite_id: number,
  referentiel: Referentiel,
  filters?: TFilters
) => {
  // lit la liste des statuts d'audit des actions
  const query = supabaseClient
    .from<TActionAuditStatut>('action_audit_state_list')
    .select()
    .match({collectivite_id, referentiel});

  const action = filters?.action;
  if (action) {
    query.eq('action_id', action.id);
  }

  const {data, error} = await query;

  if (error || !data) {
    return [];
  }

  return data;
};

/**
 * Statut d'audit d'une action du référentiel et de la collectivité courante.
 */
export const useActionAuditStatut = (action: TActionDef) => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const {data} = useQuery(
    ['action_audit_state_list', collectivite_id, referentiel, action],
    () =>
      collectivite_id && referentiel
        ? fetch(collectivite_id, referentiel as Referentiel, {action})
        : []
  );
  return data?.[0] || null;
};
