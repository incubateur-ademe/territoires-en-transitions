import { uniq } from 'es-toolkit';
import { trpc } from '@tet/api/utils/trpc/client';

/** Met à jour un ou plusieurs membres */
export const useUpdateMembres = () => {
  const utils = trpc.useUtils();

  return trpc.collectivites.membres.update.useMutation({
    // rafraichit la liste après l'enregistrement
    onSuccess: (data, variables) => {
      const collectiviteIds = uniq(variables.map((v) => v.collectiviteId));
      collectiviteIds.map((collectiviteId) =>
        utils.collectivites.membres.list.invalidate({
          collectiviteId,
        })
      );
    },
  });
};
