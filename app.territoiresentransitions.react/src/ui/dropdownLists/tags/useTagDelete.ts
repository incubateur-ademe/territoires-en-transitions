import { CollectiviteTag, TableTag } from '@/api';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { QueryKey, useMutation, useQueryClient } from 'react-query';

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

  return useMutation(
    async (tag_id: number) => {
      await supabaseClient.from(tagTableName).delete().eq('id', tag_id);
    },
    {
      mutationKey: 'delete_tag',
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
        queryClient.invalidateQueries(key);
        keysToInvalidate?.forEach((key) => queryClient.invalidateQueries(key));
      },
      onSuccess: () => onSuccess?.(),
    }
  );
};
