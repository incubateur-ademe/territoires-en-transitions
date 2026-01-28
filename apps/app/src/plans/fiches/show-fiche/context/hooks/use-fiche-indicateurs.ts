import { canUpdateIndicateurDefinition } from '@/app/indicateurs/indicateurs/indicateur-definition-authorization.utils';
import {
  IndicateurDefinitionListItem,
  useListIndicateurs,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@tet/domain/users';
import { useCallback, useMemo } from 'react';
import { useUpdateFiche } from '../../../update-fiche/data/use-update-fiche';
import { IndicateursState } from '../types';

export const useFicheIndicateurs = (
  collectivite: {
    collectiviteId: number;
    permissions: PermissionOperation[];
  },
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
    async (indicateur: IndicateurDefinitionListItem) => {
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

  const canCreate = hasPermission(
    collectivite.permissions,
    'indicateurs.indicateurs.create'
  );

  const canUpdate = useCallback(
    (indicateur: IndicateurDefinitionListItem) =>
      canUpdateIndicateurDefinition(
        collectivite.permissions,
        indicateur,
        userId
      ),
    [collectivite.permissions, userId]
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
