import {QueryKey, useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {CollectiviteTag, TableTag} from '@tet/api';

type Tag = CollectiviteTag;

type Args = {
  key: QueryKey;
  tagTableName: TableTag;
  keysToInvalidate?: QueryKey[];
};

export const useTagUpdate = ({key, tagTableName, keysToInvalidate}: Args) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (tag: Tag) => {
      if (tag.id)
        await supabaseClient.from(tagTableName).update(tag).eq('id', tag.id);
    },
    {
      mutationKey: 'update_tag',
      onMutate: async tag => {
        await queryClient.cancelQueries({queryKey: key});

        const previousdata: {tags: Tag[]} | undefined =
          queryClient.getQueryData(key);

        queryClient.setQueryData(key, (old?: Tag[]) => {
          return old ? old.map((v: Tag) => (v.id === tag.id ? tag : v)) : [];
        });

        return {previousdata};
      },
      onSettled: (data, err, args, context) => {
        if (err) {
          queryClient.setQueryData(key, context?.previousdata);
        }
        queryClient.invalidateQueries(key);
        keysToInvalidate?.forEach(key => queryClient.invalidateQueries(key));
      },
    }
  );
};
