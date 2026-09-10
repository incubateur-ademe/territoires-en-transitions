import { hashFile } from '@/app/collectivites/documents/upload/hash-file.utils';
import { useUploadFile } from '@/app/collectivites/documents/upload/use-upload-file';
import { appLabels } from '@/app/labels/catalog';
import { auditReportToPreuve } from '@/app/referentiels/preuves/mappers/audit-report-to-preuve';
import { useRemovePreuve } from '@/app/referentiels/preuves/Bibliotheque/useEditPreuve';
import {
  EXPECTED_FORMATS,
  MAX_FILE_SIZE_MB,
} from '@/app/referentiels/preuves/upload/constants';
import {
  FileValidationError,
  validateFile,
} from '@/app/referentiels/preuves/upload/validate-file';
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
  canProceed: boolean;
  uploadReport: (files: FileList | null) => Promise<void>;
  removeReport: (report: AuditReport) => Promise<void>;
  abortUpload: () => void;
};

const toValidationMessage = (error: FileValidationError): string => {
  const formats = EXPECTED_FORMATS.join(', ');
  const messageByError: Record<FileValidationError, string> = {
    sizeError: appLabels.fichierTropVolumineux({ maxMo: MAX_FILE_SIZE_MB }),
    formatError: appLabels.fichierFormatNonSupporte({ formats }),
    formatAndSizeError: appLabels.fichierFormatEtTailleInvalides({
      maxMo: MAX_FILE_SIZE_MB,
      formats,
    }),
  };
  return messageByError[error];
};

export const useUploadAuditReport = (
  auditId: number
): AuditReportUploadState => {
  const collectiviteId = useCollectiviteId();
  const { reports, isLoading: isLoadingReports } =
    useListReportsByAudit(auditId);
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const uploadFile = useUploadFile();
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

  const refetchReports = (): Promise<void> =>
    queryClient.refetchQueries({
      queryKey: trpc.referentiels.documents.listDocumentsAudit.queryKey({
        auditId,
      }),
    });

  const uploadReport = async (files: FileList | null): Promise<void> => {
    const file = files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError !== null) {
      setToast('error', toValidationMessage(validationError));
      return;
    }

    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setUploadingReport({ filename: file.name, progress: 0 });
    try {
      const { fichierId } = await uploadFile({
        collectiviteId,
        file,
        hash: await hashFile(file),
        signal: controller.signal,
        onProgress: (progress) => {
          if (controller.signal.aborted) return;
          setUploadingReport({ filename: file.name, progress });
        },
      });
      if (controller.signal.aborted) return;

      await addPreuve({
        auditId,
        collectiviteId,
        commentaire: '',
        fichierId,
      });
      // Attend que la liste des rapports soit re-fetchée avant de libérer
      // l'état d'upload pour éviter les flickering de refetch
      if (!controller.signal.aborted) {
        await refetchReports();
      }
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
    setRemovingReportIds((prev) => new Set(prev).add(report.id));
    try {
      await removePreuve(auditReportToPreuve(report));
      await refetchReports();
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

  return {
    reports,
    isLoadingReports,
    uploadingReport,
    isUploading,
    removingReportIds,
    canProceed:
      !isLoadingReports &&
      reports.length > 0 &&
      !isUploading &&
      removingReportIds.size === 0,
    uploadReport,
    removeReport,
    abortUpload,
  };
};
