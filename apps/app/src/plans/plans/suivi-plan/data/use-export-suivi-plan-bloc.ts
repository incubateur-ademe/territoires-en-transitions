import { appLabels } from '@/app/labels/catalog';
import { saveBlob } from '@/app/utils/save-blob';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import { RouterInput } from '@tet/api';

export type SuiviPlanBlocExporte =
  | 'vue-ensemble'
  | 'avancement-par-axe'
  | 'evolution-statuts';

type ExportSuiviPlanBlocInput =
  | RouterInput['plans']['suivi']['getVueEnsemble']
  | RouterInput['plans']['suivi']['getEvolutionStatuts'];

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
