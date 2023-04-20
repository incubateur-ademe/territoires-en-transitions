import {QueryKey, useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';

type Tag = {
  collectivite_id: number;
  id?: number | undefined;
  nom: string;
};

type Args = {
  key: QueryKey;
  tagTableName: string;
};

export const useTagUpdate = ({key, tagTableName}: Args) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (tag: Tag) => {
      await supabaseClient.from(tagTableName).update(tag).eq('id', tag.id);
    },
    {
      mutationKey: 'update_tag',
      onMutate: async tag => {
        await queryClient.cancelQueries({queryKey: key});

        const previousdata: {tags: Tag[]} | undefined =
          queryClient.getQueryData(key);

        queryClient.setQueryData(key, (old?: Tag[]) => {
          // return old ? old.filter((v: Tag) => v.id !== tag.id) : [];
          return old ? old.map((v: Tag) => (v.id === tag.id ? tag : v)) : [];
        });

        return {previousdata};
      },
      onSettled: (data, err, args, context) => {
        if (err) {
          queryClient.setQueryData(key, context?.previousdata);
        }
        queryClient.invalidateQueries(key);
        queryClient.invalidateQueries(['fiche_action', 13]);
      },
    }
  );
};
