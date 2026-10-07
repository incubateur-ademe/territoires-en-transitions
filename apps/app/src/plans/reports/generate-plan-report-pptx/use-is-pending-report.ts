'use client';

import { appLabels } from '@/app/labels/catalog';
import { useDownloadDocument } from '@/app/collectivites/documents/data/use-download-document';
import { useBaseToast } from '@/app/utils/toast/use-base-toast';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ReportGenerationStatusEnum } from '@tet/domain/plans';
import { useQueryState } from 'nuqs';
import { useEffect, useRef } from 'react';

const POLLING_INTERVAL = 2000;

export const useIsPendingReport = () => {
  const trpc = useTRPC();
  const { setToast, renderToast } = useBaseToast();
  const collectiviteId = useCollectiviteId();
  const handledReportIdRef = useRef<string | null>(null);
  const [pendingReportId, setPendingReportId] =
    useQueryState('downloadReportId');

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

  const { mutate: downloadDocument } = useDownloadDocument();

  // Handle report status changes
  useEffect(() => {
    if (!reportStatus || !pendingReportId) return;

    const { status } = reportStatus;
    const isGenerationOver =
      status === ReportGenerationStatusEnum.COMPLETED ||
      status === ReportGenerationStatusEnum.FAILED;
    if (!isGenerationOver) return;

    if (handledReportIdRef.current === reportStatus.id) return;
    handledReportIdRef.current = reportStatus.id;

    if (status === ReportGenerationStatusEnum.FAILED) {
      setToast(
        'error',
        appLabels.rapportGenerationEchouee(reportStatus.errorMessage)
      );
      setPendingReportId(null);
      return;
    }

    const { fileId } = reportStatus;
    if (fileId === null) {
      setToast('error', appLabels.rapportFichierIntrouvable);
      setPendingReportId(null);
      return;
    }

    downloadDocument(
      { collectiviteId, fichierId: fileId },
      { onSettled: () => setPendingReportId(null) }
    );
  }, [
    reportStatus,
    pendingReportId,
    setToast,
    downloadDocument,
    setPendingReportId,
    collectiviteId,
  ]);

  return {
    renderToast,
    isPending: !!pendingReportId,
  };
};
