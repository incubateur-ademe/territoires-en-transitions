import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { TagType, TagWithCollectiviteId } from '@tet/domain/collectivites';

type TagInput = Omit<
  RouterInput['collectivites']['tags']['update'],
  'collectiviteId' | 'tagType'
>;

type Args = {
  tagType: TagType;
  onSuccess?: () => void;
};

export const useTagUpdate = ({ tagType, onSuccess }: Args) => {
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
        return old
          ? old.map((v) => (v.id === tag.id ? { ...v, ...tag } : v))
          : [];
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

      queryClient.invalidateQueries({ queryKey: listTagsQueryKey });
    },

    onSuccess: () => onSuccess?.(),
  });
};
