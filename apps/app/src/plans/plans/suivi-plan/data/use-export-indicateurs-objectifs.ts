import { appLabels } from '@/app/labels/catalog';
import { saveBlob } from '@/app/utils/save-blob';
import { useApiClient } from '@/app/utils/use-api-client';
import { useMutation } from '@tanstack/react-query';
import type { IndicateursObjectifsFiltreSource } from '../indicateurs-objectifs/search-indicateurs-objectifs';

type ExportIndicateursObjectifsInput = {
  planId: number;
  horizon: number;
  source: IndicateursObjectifsFiltreSource;
};

export const useExportIndicateursObjectifs = () => {
  const apiClient = useApiClient();

  return useMutation({
    mutationKey: ['export_suivi_plan', 'indicateurs-objectifs'],

    mutationFn: async (input: ExportIndicateursObjectifsInput) => {
      const { blob, filename } = await apiClient.getAsBlob(
        { route: '/plan/suivi/indicateurs-objectifs/export', params: input },
        'POST'
      );
      if (blob) {
        saveBlob(blob, filename || 'suivi-indicateurs-objectifs.xlsx');
      }
    },

    meta: {
      success: appLabels.exportTermine,
      error: appLabels.exportEchec,
    },
  });
};
