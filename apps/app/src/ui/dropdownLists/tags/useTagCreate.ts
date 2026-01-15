import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { CollectiviteTag, TableTag, useTRPC } from '@tet/api';
import { TagCreate } from '@tet/domain/collectivites';
import { tableTagToTagType } from './tag-utils';

type Tag = CollectiviteTag;

type Args = {
  key: QueryKey;
  tagTableName: TableTag;
  keysToInvalidate?: QueryKey[];
  onSuccess?: () => void;
};

export const useTagCreate = ({
  key,
  tagTableName,
  keysToInvalidate,
  onSuccess,
}: Args) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { mutateAsync: createTagMutation } = useMutation(
    trpc.collectivites.tags.mutate.create.mutationOptions()
  );

  return useMutation({
    mutationKey: ['create_tag'],
    mutationFn: async (tag: TagCreate) => {
      const tagType = tableTagToTagType(tagTableName);
      return await createTagMutation({
        tagType,
        nom: tag.nom,
        collectiviteId: tag.collectiviteId,
      });
    },
    onMutate: async (tag) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previousdata: { tags: Tag[] } | undefined =
        queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old?: TagCreate[]) => {
        return old ? [tag, ...old] : [tag];
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
