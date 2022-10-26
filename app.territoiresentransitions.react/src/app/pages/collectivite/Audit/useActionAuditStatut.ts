import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {TActionAuditStatut} from './types';

export type TActionDef = Pick<
  ActionDefinitionSummary,
  'id' | 'identifiant' | 'referentiel'
>;

// charge les données
export const fetch = async (collectivite_id: number, action: TActionDef) => {
  // lit le statut d'audit d'une action
  const query = supabaseClient
    .from<TActionAuditStatut>('action_audit_state')
    .select()
    .eq('collectivite_id', collectivite_id)
    .eq('action_id', action.id);

  const {data, error} = await query;

  if (error || !data?.length) {
    return null;
  }

  return data[0] as TActionAuditStatut;
};

/**
 * Statut d'audit d'une action du référentiel et de la collectivité courante.
 * Renvoi un objet par défaut si le statut n'est pas trouvé.
 */
export const useActionAuditStatut = (action: TActionDef) => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const defaultStatut = {
    collectivite_id,
    referentiel,
    action_id: action.id,
    ordre_du_jour: false,
    avis: '',
    statut: 'non_audite',
  } as TActionAuditStatut;

  return useQuery(
    ['action_audit_state', collectivite_id, referentiel, action.id],
    () =>
      collectivite_id && referentiel
        ? fetch(collectivite_id, action).then(data => data || defaultStatut)
        : defaultStatut
  );
};
