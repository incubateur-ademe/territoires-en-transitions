import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { FicheWithRelations } from '@tet/domain/plans';
import { useUpdateFiche } from '../../../update-fiche/data/use-update-fiche';
import { MesuresState } from '../types';

export const useFicheMesures = (fiche: FicheWithRelations): MesuresState => {
  const { mutate: updateFiche } = useUpdateFiche();
  const { data: actionsLiees } = useListActions(
    {
      actionIds: fiche.mesures?.map((mesure) => mesure.id) ?? [],
    },
    true
  );

  return {
    list: actionsLiees ?? [],
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
