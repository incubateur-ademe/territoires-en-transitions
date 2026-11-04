import { canUpdateIndicateur } from '@/app/indicateurs/indicateurs/indicateur-authorization.utils';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { useListIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { useCallback, useMemo } from 'react';
import { useUpdateFiche } from '../../../update-fiche/data/use-update-fiche';
import { IndicateursState } from '../types';

export const useFicheIndicateurs = (
  collectivite: CollectiviteCurrent,
  ficheId: number,
  userId: string
): IndicateursState => {
  const { mutateAsync: updateFiche } = useUpdateFiche();

  const { data, isLoading } = useListIndicateurs({
    collectiviteId: collectivite.collectiviteId,
    filters: {
      ficheIds: [ficheId],
    },
  });

  const list = useMemo(() => data?.data ?? [], [data]);

  const update = useCallback(
    async (indicateur: IndicateurDetaille) => {
      const isAlreadyLinked = list.some((i) => i.id === indicateur.id);

      const updatedIndicateurs = isAlreadyLinked
        ? list.filter((i) => i.id !== indicateur.id)
        : [...list, indicateur];

      await updateFiche({
        ficheId,
        ficheFields: {
          indicateurs: updatedIndicateurs,
        },
      });
    },
    [ficheId, list, updateFiche]
  );

  const canCreate = collectivite.hasCollectivitePermission(
    'indicateurs.indicateurs.create'
  );

  const canUpdate = useCallback(
    (indicateur: IndicateurDetaille) =>
      canUpdateIndicateur(
        collectivite.hasCollectivitePermission,
        indicateur,
        userId
      ),
    [collectivite.hasCollectivitePermission, userId]
  );

  return useMemo(
    () => ({
      list,
      isLoading,
      update,
      canUpdate,
      canCreate,
    }),
    [list, isLoading, update, canUpdate, canCreate]
  );
};
