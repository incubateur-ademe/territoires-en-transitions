import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableTag, useTRPC } from '@tet/api';
import { TagUpdate } from '@tet/domain/collectivites';
import { tableTagToTagType } from './tag-utils';

type Args = {
  key: QueryKey;
  tagTableName: TableTag;
  keysToInvalidate?: QueryKey[];
  onSuccess?: () => void;
};

export const useTagUpdate = ({
  key,
  tagTableName,
  keysToInvalidate,
  onSuccess,
}: Args) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: updateTagMutation } = useMutation(
    trpc.collectivites.tags.mutate.update.mutationOptions()
  );

  return useMutation({
    mutationFn: async (tag: TagUpdate) => {
      if (!tag.id || !tag.collectiviteId) {
        throw new Error('Tag id and collectiviteId are required');
      }
      const tagType = tableTagToTagType(tagTableName);
      return await updateTagMutation({
        tagType,
        id: tag.id,
        nom: tag.nom,
        collectiviteId: tag.collectiviteId,
      });
    },

    onMutate: async (tag) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previousdata: { tags: TagUpdate[] } | undefined =
        queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old?: TagUpdate[]) => {
        return old
          ? old.map((v: TagUpdate) => (v.id === tag.id ? tag : v))
          : [];
      });

      return { previousdata };
    },

    onSettled: (data, err, args, context) => {
      if (err) {
        queryClient.setQueryData(key, context?.previousdata);
      }
      queryClient.invalidateQueries({ queryKey: key });
      keysToInvalidate?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },

    onSuccess: () => onSuccess?.(),
  });
};
