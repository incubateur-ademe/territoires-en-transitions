import { trpc } from '@/api/utils/trpc/client';

export const useLinkTag = () => {
  const utils = trpc.useUtils();

  return trpc.collectivites.tags.personnes.convertToUser.useMutation({
    onSuccess: (_, variables) =>
      utils.collectivites.tags.personnes.list.invalidate({
        collectiviteId: variables.collectiviteId,
      }),
  });
};
