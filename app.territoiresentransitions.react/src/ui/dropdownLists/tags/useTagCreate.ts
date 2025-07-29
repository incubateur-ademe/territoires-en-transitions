import { CollectiviteTag, TableTag } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TagInsert } from '@/domain/collectivites';
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { objectToSnake } from 'ts-case-convert';

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
  const supabase = useSupabase();

  return useMutation({
    mutationKey: ['create_tag'],
    mutationFn: async (tag: TagInsert) =>
      await supabase.from(tagTableName).insert(objectToSnake(tag)).select(),
    onMutate: async (tag) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previousdata: { tags: Tag[] } | undefined =
        queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old?: TagInsert[]) => {
        return old ? [tag, ...old] : [tag];
      });

      return { previousdata };
    },
    onSettled: (data, err, args, context) => {
      if (err) {
        queryClient.setQueryData(key, context?.previousdata);
      }
      console.log('invalidateQueries', key, keysToInvalidate);
      queryClient.invalidateQueries({ queryKey: key });
      keysToInvalidate?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
    },
    onSuccess: () => onSuccess?.(),
  });
};
