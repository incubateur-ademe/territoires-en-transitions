import {QueryKey, useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {CollectiviteTag, TableTag} from '@tet/api';

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

  return useMutation(
    async (tag: Tag) =>
      await supabaseClient.from(tagTableName).insert(tag).select(),
    {
      mutationKey: 'create_tag',
      onMutate: async tag => {
        await queryClient.cancelQueries({queryKey: key});

        const previousdata: {tags: Tag[]} | undefined =
          queryClient.getQueryData(key);

        queryClient.setQueryData(key, (old?: Tag[]) => {
          return old ? [tag, ...old] : [tag];
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
      onSuccess: () => onSuccess?.(),
    }
  );
};
