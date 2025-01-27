import { supabaseClient } from '@/app/core-logic/api/supabase';
import {
  useCollectiviteId,
  useReferentielId,
} from '@/app/core-logic/hooks/params';
import { useQuery } from 'react-query';

// vérifie si l'utilisateur courant peut commencer l'audit
export const usePeutCommencerAudit = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();

  const { data } = useQuery(
    ['peut_commencer_audit', collectivite_id, referentiel],
    async () => {
      if (!collectivite_id || !referentiel) {
        return false;
      }
      const { data } = await supabaseClient
        .rpc('labellisation_peut_commencer_audit', {
          collectivite_id,
          referentiel,
        })
        .single();
      return data || false;
    }
  );
  return data || false;
};
