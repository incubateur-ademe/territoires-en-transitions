import { Indicateurs } from '@/api';
import { Personne } from '@/api/collectivites';
import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { Tag } from '@/domain/collectivites';
import { Thematique } from '@/domain/shared';
import { useMutation } from '@tanstack/react-query';

/** Met à jour les pilotes, les services pilotes, les thématique d'un indicateur */
export const useUpdateIndicateurCard = (
  indicateurId: number,
  estPerso: boolean
) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const utils = trpc.useUtils();

  return useMutation({
    mutationKey: ['update_indicateur_card'],
    mutationFn: async ({
      pilotes,
      services,
      thematiques,
    }: {
      pilotes: Personne[];
      services: Tag[];
      thematiques: Thematique[];
    }) => {
      return Indicateurs.save.updateIndicateurCard(
        supabase,
        {
          id: indicateurId,
          estPerso,
        },
        collectiviteId,
        pilotes,
        services,
        thematiques
      );
    },
    onSuccess: () => {
      utils.indicateurs.list.invalidate({ collectiviteId });
    },
  });
};
