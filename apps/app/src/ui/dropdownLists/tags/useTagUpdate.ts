import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableTag, useSupabase } from '@tet/api';
import { TagUpdate } from '@tet/domain/collectivites';
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
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async (tag: TagUpdate) => {
      if (tag.id)
        await supabase
          .from(tagTableName)
          .update(objectToSnake(tag))
          .eq('id', tag.id);
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
