import { trpc } from '@/api/utils/trpc/client';

export const useLinkTag = () => {
  const utils = trpc.useUtils();

  return trpc.collectivites.tags.personnes.toUser.useMutation({
    onSuccess: (_data, variables) =>
      utils.collectivites.tags.personnes.list.invalidate({
        collectiviteId: variables.collectiviteId,
      }),
  });
};
