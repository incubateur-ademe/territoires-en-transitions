import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollectiviteTag, TableTag, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { tableTagToTagType } from './tag-utils';

type Tag = CollectiviteTag;

type Args = {
  key: QueryKey;
  tagTableName: TableTag;
  keysToInvalidate?: QueryKey[];
  onSuccess?: () => void;
};

export const useDeleteTag = ({
  key,
  tagTableName,
  keysToInvalidate,
  onSuccess,
}: Args) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  const { mutateAsync: deleteTagMutation } = useMutation(
    trpc.collectivites.tags.mutate.delete.mutationOptions()
  );

  return useMutation({
    mutationFn: async (tag_id: number) => {
      if (!collectiviteId) {
        throw new Error('Collectivité ID is required');
      }
      const tagType = tableTagToTagType(tagTableName);
      return await deleteTagMutation({
        tagType,
        id: tag_id,
        collectiviteId,
      });
    },

    onMutate: async (tag_id) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previousdata: { tags: Tag[] } | undefined =
        queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old?: Tag[]) => {
        return old ? old.filter((v: Tag) => v.id !== tag_id) : [];
      });

      return { previousdata };
    },

    onSettled: (data, err, args, context) => {
      if (err) {
        queryClient.setQueryData(key, context?.previousdata);
      }
      queryClient.invalidateQueries({ queryKey: key });
      keysToInvalidate?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
    },

    onSuccess: () => onSuccess?.(),
  });
};
