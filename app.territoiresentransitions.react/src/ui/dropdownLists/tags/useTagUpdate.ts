import { TableTag } from '@tet/api';
import { TagUpdate } from '@tet/api/shared/domain';
import { supabaseClient } from 'core-logic/api/supabase';
import { QueryKey, useMutation, useQueryClient } from 'react-query';
import { objectToSnake } from 'ts-case-convert';

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

  return useMutation(
    async (tag: TagUpdate) => {
      if (tag.id)
        await supabaseClient
          .from(tagTableName)
          .update(objectToSnake(tag))
          .eq('id', tag.id);
    },
    {
      mutationKey: 'update_tag',
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
        queryClient.invalidateQueries(key);
        keysToInvalidate?.forEach((key) => queryClient.invalidateQueries(key));
      },
      onSuccess: () => onSuccess?.(),
    }
  );
};
