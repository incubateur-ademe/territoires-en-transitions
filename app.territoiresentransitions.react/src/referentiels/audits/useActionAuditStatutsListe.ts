import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
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
  const supabase = useSupabase();

  const { data } = useQuery(
    ['action_audit_state_list', collectivite_id, referentiel],
    () =>
      collectivite_id && referentiel
        ? fetch(supabase, collectivite_id, referentiel)
        : []
  );
  return data || [];
};

// charge les données
const fetch = async (
  supabase: DBClient,
  collectivite_id: number,
  referentiel: ReferentielId
) => {
  // lit la liste des statuts d'audit des actions
  const query = supabase
    .from('action_audit_state')
    .select()
    .match({ collectivite_id, referentiel });

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data;
};
