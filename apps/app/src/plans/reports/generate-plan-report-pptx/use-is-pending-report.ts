'use client';

import { appLabels } from '@/app/labels/catalog';
import { useDownloadDocument } from '@/app/referentiels/preuves/data/use-download-document';
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
  const lastDownloadedReportIdRef = useRef<string | null>(null);
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

  const { mutate: downloadDocument } = useDownloadDocument({ collectiviteId });

  // Handle report status changes
  useEffect(() => {
    if (!reportStatus || !pendingReportId) return;

    if (reportStatus.status === ReportGenerationStatusEnum.FAILED) {
      setToast(
        'error',
        appLabels.rapportGenerationEchouee(reportStatus.errorMessage)
      );
      setPendingReportId(null);
      return;
    }

    if (reportStatus.status !== ReportGenerationStatusEnum.COMPLETED) return;

    const { fileId } = reportStatus;
    if (fileId === null) {
      setToast('error', appLabels.rapportFichierIntrouvable);
      setPendingReportId(null);
      return;
    }

    if (lastDownloadedReportIdRef.current === reportStatus.id) return;

    lastDownloadedReportIdRef.current = reportStatus.id;
    downloadDocument(fileId, {
      onSettled: () => setPendingReportId(null),
    });
  }, [
    reportStatus,
    pendingReportId,
    setToast,
    downloadDocument,
    setPendingReportId,
  ]);

  return {
    renderToast,
    isPending: !!pendingReportId,
  };
};
