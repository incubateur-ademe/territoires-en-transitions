import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {Referentiel} from 'types/litterals';

/**
 * Statut d'audit de toutes les actions du référentiel et de la collectivité
 * courante.
 */
export const useActionAuditStatutsListe = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const {data} = useQuery(
    ['action_audit_state_list', collectivite_id, referentiel],
    () =>
      collectivite_id && referentiel
        ? fetch(collectivite_id, referentiel as Referentiel)
        : []
  );
  return data || [];
};

// charge les données
const fetch = async (collectivite_id: number, referentiel: Referentiel) => {
  // lit la liste des statuts d'audit des actions
  const query = supabaseClient
    .from('action_audit_state')
    .select()
    .match({collectivite_id, referentiel});

  const {data, error} = await query;

  if (error || !data) {
    return [];
  }

  return data;
};
