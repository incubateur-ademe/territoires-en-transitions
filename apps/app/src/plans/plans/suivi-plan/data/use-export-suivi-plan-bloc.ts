import { appLabels } from '@/app/labels/catalog';
import { saveBlob } from '@/app/utils/save-blob';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { ListFichesRequestFilters } from '@tet/domain/plans';

export type SuiviPlanBlocExporte =
  | 'vue-ensemble'
  | 'avancement-par-axe'
  | 'evolution-statuts';

type ExportSuiviPlanBlocInput = {
  planId: number;
  thematiqueIds?: number[];
  filters?: Pick<
    ListFichesRequestFilters,
    | 'statuts'
    | 'noStatut'
    | 'priorites'
    | 'noPriorite'
    | 'personnePiloteIds'
    | 'utilisateurPiloteIds'
    | 'noPilote'
    | 'personneReferenteIds'
    | 'utilisateurReferentIds'
    | 'noReferent'
    | 'enCoursSansAvancement'
    | 'notModifiedForOverAYear'
  >;
  dateDebut?: string;
  dateFin?: string;
  inclureActionsContinues?: boolean;
};

export const useExportSuiviPlanBloc = (bloc: SuiviPlanBlocExporte) => {
  const apiClient = useApiClient();

  return useMutation({
    mutationKey: ['export_suivi_plan', bloc],

    mutationFn: async (input: ExportSuiviPlanBlocInput) => {
      const { blob, filename } = await apiClient.getAsBlob(
        { route: `/plan/suivi/${bloc}/export`, params: input },
        'POST'
      );
      if (blob) {
        saveBlob(blob, filename || `suivi-${bloc}.xlsx`);
      }
    },

    meta: {
      success: appLabels.exportTermine,
      error: appLabels.exportEchec,
    },
  });
};
