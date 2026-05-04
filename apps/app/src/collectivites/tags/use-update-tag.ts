import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  TagEnum,
  TagType,
  TagWithCollectiviteId,
} from '@tet/domain/collectivites';
import { invalidateFicheQueriesByTag } from './invalidate-fiche-queries-by-tag';
import { patchServiceTagInDenormalizedCaches } from './patch-service-tag-in-denormalized-caches';

type TagInput = Omit<
  RouterInput['collectivites']['tags']['update'],
  'collectiviteId' | 'tagType'
>;

type Args = {
  tagType: TagType;
  onSuccess?: () => void;
};

export const useUpdateTag = ({ tagType, onSuccess }: Args) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  const { mutateAsync: updateTagMutation } = useMutation(
    trpc.collectivites.tags.update.mutationOptions()
  );

  return useMutation({
    mutationFn: async (tag: TagInput) => {
      return await updateTagMutation({
        tagType,
        id: tag.id,
        nom: tag.nom,
        collectiviteId,
      });
    },

    onMutate: async (tag) => {
      const listTagsQueryKey = trpc.collectivites.tags.list.queryKey({
        collectiviteId,
        tagType,
      });
      await queryClient.cancelQueries({ queryKey: listTagsQueryKey });

      const previousdata: TagWithCollectiviteId[] | undefined =
        queryClient.getQueryData(listTagsQueryKey);

      queryClient.setQueryData(listTagsQueryKey, (old) => {
        return old?.map((v) => (v.id === tag.id ? { ...v, ...tag } : v));
      });

      return { previousdata };
    },

    onSettled: (data, err, args, context) => {
      const listTagsQueryKey = trpc.collectivites.tags.list.queryKey({
        collectiviteId,
        tagType,
      });

      if (err) {
        queryClient.setQueryData(listTagsQueryKey, context?.previousdata);
      }

      if (!err && tagType === TagEnum.Service) {
        patchServiceTagInDenormalizedCaches({
          queryClient,
          trpc,
          collectiviteId,
          tagId: args.id,
          nom: args.nom,
        });
      }

      queryClient.invalidateQueries({ queryKey: listTagsQueryKey });
      invalidateFicheQueriesByTag({
        queryClient,
        trpc,
        tagType,
        tagId: args.id,
      });
    },

    onSuccess: () => onSuccess?.(),
  });
};
