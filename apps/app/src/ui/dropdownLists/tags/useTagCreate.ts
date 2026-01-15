import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { TagType, TagWithCollectiviteId } from '@tet/domain/collectivites';

type TagInput = Pick<RouterInput['collectivites']['tags']['create'], 'nom'>;

type Args = {
  tagType: TagType;
  onSuccess?: () => void;
};

export const useTagCreate = ({ tagType, onSuccess }: Args) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  const { mutateAsync: createTagMutation } = useMutation(
    trpc.collectivites.tags.create.mutationOptions()
  );

  return useMutation({
    mutationFn: async (tag: TagInput) => {
      return await createTagMutation({
        tagType,
        nom: tag.nom,
        collectiviteId,
      });
    },
    onMutate: async (tag) => {
      const listTagsQueryKey = trpc.collectivites.tags.list.queryKey({
        collectiviteId,
        tagType,
      });

      await queryClient.cancelQueries({
        queryKey: listTagsQueryKey,
      });

      const previousdata: TagWithCollectiviteId[] | undefined =
        queryClient.getQueryData(listTagsQueryKey);

      queryClient.setQueryData(listTagsQueryKey, (old) => {
        const newTag = { ...tag, collectiviteId, id: -1 };
        return old ? [newTag, ...old] : [newTag];
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
