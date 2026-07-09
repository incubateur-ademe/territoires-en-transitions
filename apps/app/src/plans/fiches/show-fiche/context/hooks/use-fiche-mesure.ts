import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { FicheWithRelations } from '@tet/domain/plans';
import { useUpdateFiche } from '../../../update-fiche/data/use-update-fiche';
import { MesuresState } from '../types';

export const useFicheMesures = (fiche: FicheWithRelations): MesuresState => {
  const { mutate: updateFiche } = useUpdateFiche();
  const mesureIds = fiche.mesures?.map((mesure) => mesure.id) ?? [];
  const { data: actionsLiees, isPending: isListPending } = useListActions(
    { actionIds: mesureIds },
    { enabled: mesureIds.length > 0 }
  );

  return {
    isListPending: mesureIds.length > 0 && isListPending,
    list: mesureIds.length === 0 ? [] : (actionsLiees ?? []),
    linkMesure: async (mesureId: string) => {
      await updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          mesures: [...(fiche.mesures ?? []), { id: mesureId }],
        },
      });
    },
    unlinkMesure: async (mesureId: string) => {
      await updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          mesures: (fiche.mesures ?? []).filter((m) => m.id !== mesureId),
        },
      });
    },
  };
};
