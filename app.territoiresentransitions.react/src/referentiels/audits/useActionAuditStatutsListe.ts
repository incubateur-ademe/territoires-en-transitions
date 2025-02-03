import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from 'react-query';
import { useReferentielId } from '../referentiel-context';

/**
 * Statut d'audit de toutes les actions du référentiel et de la collectivité
 * courante.
 */
export const useActionAuditStatutsListe = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const { data } = useQuery(
    ['action_audit_state_list', collectivite_id, referentiel],
    () =>
      collectivite_id && referentiel ? fetch(collectivite_id, referentiel) : []
  );
  return data || [];
};

// charge les données
const fetch = async (collectivite_id: number, referentiel: ReferentielId) => {
  // lit la liste des statuts d'audit des actions
  const query = supabaseClient
    .from('action_audit_state')
    .select()
    .match({ collectivite_id, referentiel });

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data;
};
