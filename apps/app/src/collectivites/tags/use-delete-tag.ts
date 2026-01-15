import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { TagType, TagWithCollectiviteId } from '@tet/domain/collectivites';
import { invalidateFicheQueriesByTag } from './invalidate-fiche-queries-by-tag';

type Args = {
  tagType: TagType;
  onSuccess?: () => void;
};

export const useDeleteTag = ({ tagType, onSuccess }: Args) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  const { mutateAsync: deleteTagMutation } = useMutation(
    trpc.collectivites.tags.delete.mutationOptions()
  );

  return useMutation({
    mutationFn: async (tagId: number) => {
      return await deleteTagMutation({
        tagType,
        id: tagId,
        collectiviteId,
      });
    },

    onMutate: async (tagId) => {
      const listTagsQueryKey = trpc.collectivites.tags.list.queryKey({
        collectiviteId,
        tagType,
      });

      await queryClient.cancelQueries({ queryKey: listTagsQueryKey });

      const previousdata: TagWithCollectiviteId[] | undefined =
        queryClient.getQueryData(listTagsQueryKey);

      queryClient.setQueryData(
        listTagsQueryKey,
        (old?: TagWithCollectiviteId[]) => {
          return old ? old.filter((v) => v.id !== tagId) : [];
        }
      );

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

      queryClient.invalidateQueries({ queryKey: listTagsQueryKey });
      invalidateFicheQueriesByTag({
        queryClient,
        trpc,
        tagType,
        tagId: args,
      });
    },

    onSuccess: () => onSuccess?.(),
  });
};
