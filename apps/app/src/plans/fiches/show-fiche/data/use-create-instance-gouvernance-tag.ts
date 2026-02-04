import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useUpdateFiche } from '../../update-fiche/data/use-update-fiche';

type CreateInstanceGouvernanceInput =
  RouterInput['collectivites']['tags']['instanceGouvernance']['create'];

type ExtendedInput = CreateInstanceGouvernanceInput & {
  ficheId?: number;
};

export const useCreateInstanceGouvernanceTag = (
  collectiviteId: number,
  ficheId?: number
) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutateAsync: updateFiche } = useUpdateFiche();

  const createTagMutation = useMutation(
    trpc.collectivites.tags.instanceGouvernance.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.tags.instanceGouvernance.list.queryKey({
            collectiviteId,
          }),
        });
      },
    })
  );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (input: ExtendedInput) => {
      const { ficheId: inputFicheId, ...createInput } = input;
      const targetFicheId = inputFicheId ?? ficheId;

      const createdTag = await createTagMutation.mutateAsync(createInput);

      if (targetFicheId) {
        const currentFiche = await queryClient.fetchQuery(
          trpc.plans.fiches.get.queryOptions({ id: targetFicheId })
        );

        const existingTags = currentFiche?.instanceGouvernance || [];

        const updatedTags = [
          ...existingTags.map((tag) => ({ id: tag.id })),
          { id: createdTag.id },
        ];

        await updateFiche({
          ficheId: targetFicheId,
          ficheFields: {
            instanceGouvernance: updatedTags,
          },
        });
      }

      return createdTag;
    },
  });

  return {
    mutate: mutateAsync,
    isPending: isPending || createTagMutation.isPending,
  };
};
