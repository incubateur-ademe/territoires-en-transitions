import { appLabels } from '@/app/labels/catalog';
import { auditReportToPreuve } from '@/app/referentiels/preuves/mappers/audit-report-to-preuve';
import {
  EXPECTED_FORMATS,
  MAX_FILE_SIZE_MB,
} from '@/app/referentiels/preuves/upload/constants';
import { useUploadFileToCollectiviteLibrary } from '@/app/referentiels/preuves/upload/use-upload-file-to-collectivite-library';
import { validateFile } from '@/app/referentiels/preuves/upload/validate-file';
import { useRemovePreuve } from '@/app/referentiels/preuves/Bibliotheque/useEditPreuve';
import { useAddPreuveAudit } from '@/app/referentiels/preuves/useAddPreuves';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useEffect, useRef, useState } from 'react';
import {
  AuditReport,
  useListReportsByAudit,
} from './use-list-reports-by-audit';

export type UploadingReport = {
  filename: string;
  progress: number;
};

export type AuditReportUploadState = {
  reports: Array<AuditReport>;
  isLoadingReports: boolean;
  uploadingReport: UploadingReport | null;
  isUploading: boolean;
  removingReportIds: ReadonlySet<number>;
  isRemoving: boolean;
  canProceed: boolean;
  uploadReport: (files: FileList | null) => Promise<void>;
  removeReport: (report: AuditReport) => Promise<void>;
  abortUpload: () => void;
};

export const useUploadAuditReport = (
  auditId: number
): AuditReportUploadState => {
  const collectiviteId = useCollectiviteId();
  const { reports, isLoading: isLoadingReports } =
    useListReportsByAudit(auditId);
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const uploadFileToLibrary = useUploadFileToCollectiviteLibrary();
  const { mutateAsync: addPreuve } = useAddPreuveAudit();
  const { mutateAsync: removePreuve } = useRemovePreuve();
  const { setToast } = useToastContext();

  const [uploadingReport, setUploadingReport] =
    useState<UploadingReport | null>(null);
  const [removingReportIds, setRemovingReportIds] = useState<
    ReadonlySet<number>
  >(() => new Set<number>());
  const uploadAbortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      uploadAbortRef.current?.abort();
    },
    []
  );

  const isUploading = uploadingReport !== null;

  const uploadReport = async (files: FileList | null): Promise<void> => {
    const file = files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError !== null) {
      const formats = EXPECTED_FORMATS.join(', ');
      const messageByError: Record<typeof validationError, string> = {
        sizeError: appLabels.fichierTropVolumineux({ maxMo: MAX_FILE_SIZE_MB }),
        formatError: appLabels.fichierFormatNonSupporte({ formats }),
        formatAndSizeError: appLabels.fichierFormatEtTailleInvalides({
          maxMo: MAX_FILE_SIZE_MB,
          formats,
        }),
      };
      setToast('error', messageByError[validationError]);
      return;
    }

    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setUploadingReport({ filename: file.name, progress: 0 });
    try {
      const fichierId = await uploadFileToLibrary({
        file,
        signal: controller.signal,
        onProgress: (progress) => {
          if (controller.signal.aborted) return;
          setUploadingReport({ filename: file.name, progress });
        },
      });
      if (controller.signal.aborted || fichierId === null) return;

      await addPreuve({
        auditId,
        collectiviteId,
        commentaire: '',
        fichierId,
      });
      if (controller.signal.aborted) return;
      // Attend que la liste des rapports soit re-fetchée avant de libérer
      // l'état d'upload pour éviter les flickering de refetch
      await queryClient.refetchQueries({
        queryKey: trpc.referentiels.labellisations.listPreuvesAudit.queryKey({
          auditId,
        }),
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      setToast('error', appLabels.echecAssociationRapport);
    } finally {
      if (uploadAbortRef.current === controller) {
        uploadAbortRef.current = null;
      }
      if (!controller.signal.aborted) {
        setUploadingReport(null);
      }
    }
  };

  const removeReport = async (report: AuditReport): Promise<void> => {
    setRemovingReportIds((prev) => {
      const next = new Set(prev);
      next.add(report.id);
      return next;
    });
    try {
      await removePreuve(auditReportToPreuve(report));
      await queryClient.refetchQueries({
        queryKey: trpc.referentiels.labellisations.listPreuvesAudit.queryKey({
          auditId,
        }),
      });
    } catch (error) {
      console.error(error);
      setToast('error', appLabels.echecSuppressionRapport);
    } finally {
      setRemovingReportIds((prev) => {
        const next = new Set(prev);
        next.delete(report.id);
        return next;
      });
    }
  };

  const abortUpload = (): void => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setUploadingReport(null);
  };

  const isRemoving = removingReportIds.size > 0;
  return {
    reports,
    isLoadingReports,
    uploadingReport,
    isUploading,
    removingReportIds,
    isRemoving,
    canProceed: !isLoadingReports && reports.length > 0 && !isUploading && !isRemoving,
    uploadReport,
    removeReport,
    abortUpload,
  };
};
