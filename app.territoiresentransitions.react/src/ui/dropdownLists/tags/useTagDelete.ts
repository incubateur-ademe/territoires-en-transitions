import { CollectiviteTag, TableTag } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async (tag_id: number) => {
      await supabase.from(tagTableName).delete().eq('id', tag_id);
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
