import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { MembreFonction } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';

export type TUpdateMembreArgs = {
  userId: string;
} & (
  | { name: 'fonction'; value: MembreFonction }
  | { name: 'detailsFonction'; value: string }
  | { name: 'champIntervention'; value: ReferentielId[] }
  | { name: 'role'; value: CollectiviteRole }
);

export type TUpdateMembre = (args: TUpdateMembreArgs) => void;

/**
 * Met à jour une propriété d'un des membres de la collectivité courante
 */
export const useUpdateMembre = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  const { isPending, mutate } = useMutation(
    trpc.collectivites.membres.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.membres.list.queryKey({
            collectiviteId,
          }),
        });
      },
    })
  );

  const updateMembre = (args: TUpdateMembreArgs) => {
    if (!collectiviteId) return;

    mutate([
      {
        collectiviteId,
        userId: args.userId,
        [args.name]: args.value,
      },
    ]);
  };

  return {
    isPending,
    updateMembre: updateMembre as TUpdateMembre,
  };
};
