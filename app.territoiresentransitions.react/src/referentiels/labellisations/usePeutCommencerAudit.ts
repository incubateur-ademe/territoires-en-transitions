import { supabaseClient } from '@/app/core-logic/api/supabase';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from 'react-query';

// vérifie si l'utilisateur courant peut commencer l'audit
export const usePeutCommencerAudit = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}) => {
  const { data } = useQuery(
    ['peut_commencer_audit', collectiviteId, referentielId],
    async () => {
      if (!collectiviteId || !referentielId) {
        return false;
      }
      const { data } = await supabaseClient
        .rpc('labellisation_peut_commencer_audit', {
          collectivite_id: collectiviteId,
          referentiel: referentielId,
        })
        .single();
      return data || false;
    }
  );
  return data || false;
};
