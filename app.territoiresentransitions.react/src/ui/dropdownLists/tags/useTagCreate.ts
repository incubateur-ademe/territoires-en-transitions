import { CollectiviteTag, TableTag } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TagInsert } from '@/domain/collectivites';
import { QueryKey, useMutation, useQueryClient } from 'react-query';
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

  return useMutation(
    async (tag: TagInsert) =>
      await supabase.from(tagTableName).insert(objectToSnake(tag)).select(),
    {
      mutationKey: 'create_tag',
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
        queryClient.invalidateQueries(key);
        keysToInvalidate?.forEach((key) => queryClient.invalidateQueries(key));
      },
      onSuccess: () => onSuccess?.(),
    }
  );
};
