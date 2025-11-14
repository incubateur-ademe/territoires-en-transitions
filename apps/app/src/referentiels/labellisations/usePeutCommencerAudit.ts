import { useSupabase } from '@/api';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';

// vérifie si l'utilisateur courant peut commencer l'audit
export const usePeutCommencerAudit = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}) => {
  const supabase = useSupabase();

  const { data } = useQuery({
    queryKey: ['peut_commencer_audit', collectiviteId, referentielId],

    queryFn: async () => {
      if (!collectiviteId || !referentielId) {
        return false;
      }
      const { data } = await supabase
        .rpc('labellisation_peut_commencer_audit', {
          collectivite_id: collectiviteId,
          referentiel: referentielId,
        })
        .single();
      return data || false;
    },
  });
  return data || false;
};
