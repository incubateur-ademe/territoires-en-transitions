'use client';

import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { useBaseToast } from '@/app/utils/toast/use-base-toast';
import { useApiClient } from '@/app/utils/use-api-client';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ReportGenerationStatusEnum } from '@tet/domain/plans';
import { getErrorMessage } from '@tet/domain/utils';
import { Button } from '@tet/ui';
import { useQueryState } from 'nuqs';
import { useCallback, useEffect } from 'react';
import {
  GenerateReportPlanModal,
  GenerateReportPlanModalProps,
} from './generate-report.modal';
import { useGeneratePptxPlanReportEnabled } from './use-generate-pptx-plan-report-enabled';

const POLLING_INTERVAL = 2000;

export const GenerateReportButton = ({
  plan,
}: GenerateReportPlanModalProps) => {
  const trpc = useTRPC();
  const apiClient = useApiClient();
  const { setToast, renderToast } = useBaseToast();
  const collectiviteId = useCollectiviteId();
  const [pendingReportId, setPendingReportId] =
    useQueryState('downloadReportId');

  const isGeneratePptxPlanReportEnabled = useGeneratePptxPlanReportEnabled();

  // Poll report status when a report is pending
  const { data: reportStatus } = useQuery({
    ...trpc.plans.reports.get.queryOptions({ reportId: pendingReportId ?? '' }),
    enabled: !!pendingReportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling when completed or failed
      if (
        status === ReportGenerationStatusEnum.COMPLETED ||
        status === ReportGenerationStatusEnum.FAILED
      ) {
        return false;
      }
      return POLLING_INTERVAL;
    },
  });

  const downloadReport = useCallback(
    async (
      collectiviteId: number,
      reportGenerationId: string,
      onSuccess: (filename: string) => void,
      onFailure: (error: unknown) => void
    ) => {
      try {
        const { blob, filename } = await apiClient.getAsBlob({
          route: `/collectivites/${collectiviteId}/documents/${reportGenerationId}/download`,
        });

        if (filename && blob) {
          saveBlob(blob, filename);
        }
        onSuccess(filename ?? '');
      } catch (error) {
        console.error(error);
        onFailure(error);
      }
    },
    [apiClient, setToast]
  );

  // Handle report status changes
  useEffect(() => {
    if (!reportStatus || !pendingReportId) return;

    const fileCanBeDownloaded =
      reportStatus.status === ReportGenerationStatusEnum.COMPLETED &&
      reportStatus.fileId;
    if (fileCanBeDownloaded) {
      setToast('info', 'Téléchargement du rapport en cours...');
      downloadReport(
        collectiviteId,
        reportStatus.id,
        (fileName) => {
          setToast(
            'success',
            `Le rapport ${fileName} a été téléchargé avec succès`
          );
          setPendingReportId(null);
        },
        (error) => {
          setToast(
            'error',
            `Une erreur est survenue lors du téléchargement du rapport: ${getErrorMessage(
              error
            )}`
          );
          setPendingReportId(null);
        }
      );
    }

    if (reportStatus.status === ReportGenerationStatusEnum.FAILED) {
      setToast(
        'error',
        `La génération du rapport a échoué: ${
          reportStatus.errorMessage ?? 'Erreur inconnue'
        }`
      );
      setPendingReportId(null);
    }
  }, [reportStatus, pendingReportId]);

  if (!isGeneratePptxPlanReportEnabled) {
    return null;
  }

  return (
    <>
      <GenerateReportPlanModal
        plan={plan}
        onGenerationStarted={(reportId) => setPendingReportId(reportId)}
      >
        <Button
          variant="white"
          size="sm"
          className="py-1.5"
          loading={!!pendingReportId}
          disabled={!!pendingReportId}
        >
          Générer un rapport
        </Button>
      </GenerateReportPlanModal>
      {renderToast()}
    </>
  );
};
