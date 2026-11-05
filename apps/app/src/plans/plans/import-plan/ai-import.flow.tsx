'use client';

import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { appLabels } from '@/app/labels/catalog';
import { useQueryStates } from 'nuqs';
import { ReactElement, useEffect, useState } from 'react';
import { AiImportStatusView } from './ai-import-status.view';
import { aiImportQueryState } from './ai-import.query-state';
import {
  AiImportDefaults,
  AiImportForm,
  AiImportSubmission,
} from './ai-import.form';
import { useEnqueueAiImport } from './data/use-enqueue-ai-import';
import { useGetCurrentAiImport } from './data/use-get-current-ai-import';
import { useGetAiImportStatus } from './data/use-get-ai-import-status';

const CheckingOngoingImport = () => (
  <div className="flex justify-center py-10">
    <SpinnerLoader className="w-8 h-8" />
  </div>
);

/**
 * Formulaire puis suivi d'un import. Reprend l'import déjà en cours de la
 * collectivité s'il y en a un : un seul import à la fois par collectivité.
 */
export const AiImportFlow = ({
  onPlanCreated,
  onImportStarted,
  cancelButton,
  lockedPlanTypeId,
  defaults,
  onProgressVisibilityChange,
}: {
  /**
   * `jobId` : l'import terminé, qu'il ait été lancé depuis ce formulaire ou
   * repris d'un import en cours lancé ailleurs.
   */
  onPlanCreated: (planId: number, options: { jobId: string }) => void;
  /**
   * Import lancé depuis ce formulaire. Le formulaire est démonté à la
   * fermeture d'une modale : c'est au parent de s'en souvenir.
   */
  onImportStarted?: (jobId: string, planId: number | null) => void;
  cancelButton: ReactElement;
  lockedPlanTypeId?: number;
  defaults?: AiImportDefaults;
  /** Le suivi tient dans une modale plus étroite que le formulaire. */
  onProgressVisibilityChange?: (isProgressVisible: boolean) => void;
}) => {
  const collectiviteId = useCollectiviteId();
  const { setToast } = useToastContext();
  const [{ importJobId }, setImportQuery] = useQueryStates(aiImportQueryState);
  const [followCurrentImport, setFollowCurrentImport] = useState(true);
  const {
    data: currentImport,
    isFetchedAfterMount,
    error,
    refetch,
  } = useGetCurrentAiImport(collectiviteId, {
    enabled: importJobId === null && followCurrentImport,
  });
  const resumedJobId =
    isFetchedAfterMount && followCurrentImport
      ? currentImport?.jobId ?? null
      : null;
  const jobId = importJobId ?? resumedJobId;
  const statusQuery = useGetAiImportStatus(jobId);
  const isCheckingOngoingImport =
    jobId === null && followCurrentImport && !isFetchedAfterMount;
  const isProgressVisible = jobId !== null;

  // Persister aussi les imports lancés depuis une autre page avant leur fin.
  useEffect(() => {
    if (importJobId === null && resumedJobId !== null) {
      void setImportQuery({ importJobId: resumedJobId });
    }
  }, [importJobId, resumedJobId, setImportQuery]);
  useEffect(() => {
    onProgressVisibilityChange?.(isProgressVisible);
  }, [isProgressVisible, onProgressVisibilityChange]);

  const enqueue = useEnqueueAiImport();

  const handleSubmit = async (values: AiImportSubmission) => {
    try {
      const { jobId: newJobId, planId } = await enqueue.mutateAsync({
        collectiviteId,
        file: values.file,
        planName: values.planName,
        planType: values.planType ?? undefined,
        instructions: values.instructions.trim() || undefined,
        withVerifications: values.withVerifications,
        withSousActions: values.withSousActions,
        confirmReimport: values.confirmReimport,
      });
      await setImportQuery({ importJobId: newJobId });
      onImportStarted?.(newJobId, planId);
    } catch (error) {
      setToast('error', getErrorMessage(error));
    }
  };

  if (jobId !== null) {
    return (
      <AiImportStatusView
        key={jobId}
        jobId={jobId}
        statusQuery={statusQuery}
        onPlanCreated={onPlanCreated}
        onNewImport={() => {
          setFollowCurrentImport(false);
          void setImportQuery({ importJobId: null });
        }}
      />
    );
  }
  if (error && followCurrentImport) {
    return (
      <ErrorCard
        title={appLabels.importPlanIaSuiviErreur}
        retry={() => refetch()}
      />
    );
  }
  if (isCheckingOngoingImport) {
    return <CheckingOngoingImport />;
  }
  return (
    <AiImportForm
      onSubmit={handleSubmit}
      cancelButton={cancelButton}
      lockedPlanTypeId={lockedPlanTypeId}
      defaults={defaults}
    />
  );
};
