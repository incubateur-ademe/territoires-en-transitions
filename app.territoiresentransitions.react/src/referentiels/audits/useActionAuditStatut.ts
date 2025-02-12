import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useQuery } from 'react-query';
import { useReferentielId } from '../referentiel-context';
import { TActionAuditStatut } from './types';

export type TActionDef = Pick<
  ActionDefinitionSummary,
  'id' | 'identifiant' | 'referentiel'
>;

// charge les données
export const fetch = async (
  supabase: DBClient,
  collectivite_id: number,
  action: TActionDef
) => {
  // lit le statut d'audit d'une action
  const query = supabase
    .from('action_audit_state')
    .select()
    .eq('collectivite_id', collectivite_id)
    .eq('action_id', action.id);

  const { data, error } = await query;

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
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const supabase = useSupabase();

  const defaultStatut = {
    collectivite_id: collectiviteId,
    referentiel: referentielId,
    action_id: action.id,
    ordre_du_jour: false,
    avis: '',
    statut: 'non_audite',
  } as TActionAuditStatut;

  return useQuery(
    ['action_audit_state', collectiviteId, referentielId, action.id],
    () =>
      collectiviteId && referentielId
        ? fetch(supabase, collectiviteId, action).then(
            (data) => data || defaultStatut
          )
        : defaultStatut,
    { keepPreviousData: true }
  );
};
