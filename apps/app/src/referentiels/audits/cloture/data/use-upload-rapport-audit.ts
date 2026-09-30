import { hashFile } from '@/app/collectivites/documents/upload/hash-file.utils';
import { useUploadFile } from '@/app/collectivites/documents/upload/use-upload-file';
import { appLabels } from '@/app/labels/catalog';
import { useRemovePreuve } from '@/app/collectivites/documents/bibliotheque/use-edit-preuve';
import {
  EXPECTED_FORMATS,
  MAX_UPLOAD_SIZE_MB,
} from '@/app/collectivites/documents/upload/constants';
import {
  FileValidationError,
  validateFile,
} from '@/app/collectivites/documents/upload/validate-file';
import { useInvalidateDocuments } from '@/app/collectivites/documents/use-invalidate-documents';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useEffect, useRef, useState } from 'react';
import {
  RapportAudit,
  useListRapportsByAudit,
} from './use-list-rapports-by-audit';

export type UploadingRapport = {
  filename: string;
  progress: number;
};

export type RapportAuditUploadState = {
  reports: Array<RapportAudit>;
  isLoadingRapports: boolean;
  uploadingRapport: UploadingRapport | null;
  isUploading: boolean;
  removingRapportIds: ReadonlySet<number>;
  canProceed: boolean;
  uploadRapport: (files: FileList | null) => Promise<void>;
  removeRapport: (report: RapportAudit) => Promise<void>;
  abortUpload: () => void;
};

const toValidationMessage = (error: FileValidationError): string => {
  const formats = EXPECTED_FORMATS.join(', ');
  const messageByError: Record<FileValidationError, string> = {
    sizeError: appLabels.fichierTropVolumineux({ maxMo: MAX_UPLOAD_SIZE_MB }),
    formatError: appLabels.fichierFormatNonSupporte({ formats }),
    formatAndSizeError: appLabels.fichierFormatEtTailleInvalides({
      maxMo: MAX_UPLOAD_SIZE_MB,
      formats,
    }),
  };
  return messageByError[error];
};

export const useUploadRapportAudit = (
  auditId: number
): RapportAuditUploadState => {
  const collectiviteId = useCollectiviteId();
  const { reports, isLoading: isLoadingRapports } =
    useListRapportsByAudit(auditId);
  const trpc = useTRPC();
  const uploadFile = useUploadFile();
  const invalidateDocuments = useInvalidateDocuments();
  const { mutateAsync: addAuditDocument } = useMutation(
    trpc.referentiels.labellisations.addAuditDocument.mutationOptions({
      meta: { disableToast: true },
      onSuccess: () =>
        invalidateDocuments({ type: 'audit', collectiviteId, auditId }),
    })
  );
  const { mutateAsync: removePreuve } = useRemovePreuve();
  const { setToast } = useToastContext();

  const [uploadingRapport, setUploadingRapport] =
    useState<UploadingRapport | null>(null);
  const [removingRapportIds, setRemovingRapportIds] = useState<
    ReadonlySet<number>
  >(() => new Set<number>());
  const uploadAbortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      uploadAbortRef.current?.abort();
    },
    []
  );

  const isUploading = uploadingRapport !== null;

  const uploadRapport = async (files: FileList | null): Promise<void> => {
    const file = files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError !== null) {
      setToast('error', toValidationMessage(validationError));
      return;
    }

    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setUploadingRapport({ filename: file.name, progress: 0 });
    try {
      const { fichierId } = await uploadFile({
        collectiviteId,
        file,
        hash: await hashFile(file),
        signal: controller.signal,
        onProgress: (progress) => {
          if (controller.signal.aborted) return;
          setUploadingRapport({ filename: file.name, progress });
        },
      });
      if (controller.signal.aborted) return;

      await addAuditDocument({ auditId, fichierId });
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      setToast('error', appLabels.echecAssociationRapport);
    } finally {
      if (uploadAbortRef.current === controller) {
        uploadAbortRef.current = null;
      }
      if (!controller.signal.aborted) {
        setUploadingRapport(null);
      }
    }
  };

  const removeRapport = async (report: RapportAudit): Promise<void> => {
    setRemovingRapportIds((prev) => new Set(prev).add(report.id));
    try {
      await removePreuve(report);
    } catch (error) {
      console.error(error);
      setToast('error', appLabels.echecSuppressionRapport);
    } finally {
      setRemovingRapportIds((prev) => {
        const next = new Set(prev);
        next.delete(report.id);
        return next;
      });
    }
  };

  const abortUpload = (): void => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setUploadingRapport(null);
  };

  return {
    reports,
    isLoadingRapports,
    uploadingRapport,
    isUploading,
    removingRapportIds,
    canProceed:
      !isLoadingRapports &&
      reports.length > 0 &&
      !isUploading &&
      removingRapportIds.size === 0,
    uploadRapport,
    removeRapport,
    abortUpload,
  };
};
