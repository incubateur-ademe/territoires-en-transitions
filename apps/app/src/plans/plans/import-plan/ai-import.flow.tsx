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
import {
  useEnqueueAiImport,
  type AiImportOrigine,
} from './data/use-enqueue-ai-import';
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
  renderStagesProgress,
  origine = 'page',
  demarcheId,
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
  /**
   * Suivi grand public en quatre étapes, mis en page par l'appelant. Sans lui,
   * le détail des étapes du pipeline s'affiche. Un échec garde le détail.
   */
  renderStagesProgress?: (stagesList: ReactElement) => ReactElement;
  /** D'où l'import est lancé, transmis au serveur pour le suivi. */
  origine?: AiImportOrigine;
  demarcheId?: number;
}) => {
  const collectiviteId = useCollectiviteId();
  const { setToast } = useToastContext();
  const [{ importJobId, retryJobId }, setImportQuery] =
    useQueryStates(aiImportQueryState);
  const [followCurrentImport, setFollowCurrentImport] = useState(true);
  const {
    data: currentImport,
    isFetchedAfterMount,
    error,
    refetch,
  } = useGetCurrentAiImport(collectiviteId, {
    enabled: importJobId === null && retryJobId === null && followCurrentImport,
  });
  const resumedJobId =
    isFetchedAfterMount && followCurrentImport && retryJobId === null
      ? currentImport?.jobId ?? null
      : null;
  const jobId = importJobId ?? resumedJobId;
  const statusQuery = useGetAiImportStatus(jobId ?? retryJobId);
  const isCheckingOngoingImport =
    jobId === null &&
    retryJobId === null &&
    followCurrentImport &&
    !isFetchedAfterMount;
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
        profile: values.profile,
        planName: values.planName,
        planType: values.planType ?? undefined,
        instructions: values.instructions.trim() || undefined,
        withVerifications: values.withVerifications,
        withSousActions: values.withSousActions,
        confirmReimport: values.confirmReimport,
        origine,
        demarcheId,
      });
      await setImportQuery({ importJobId: newJobId, retryJobId: null });
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
        renderStagesProgress={renderStagesProgress}
        origine={origine}
        demarcheId={demarcheId}
        onPlanCreated={onPlanCreated}
        onRetry={() => {
          setFollowCurrentImport(false);
          void setImportQuery({ importJobId: null, retryJobId: jobId });
        }}
      />
    );
  }
  if (error && followCurrentImport && retryJobId === null) {
    return (
      <ErrorCard
        title={appLabels.importPlanIaSuiviErreur}
        retry={() => refetch()}
      />
    );
  }
  if (retryJobId !== null && statusQuery.error) {
    return (
      <ErrorCard
        title={appLabels.importPlanIaSuiviErreur}
        retry={() => statusQuery.refetch()}
      />
    );
  }
  if (isCheckingOngoingImport || (retryJobId !== null && !statusQuery.data)) {
    return <CheckingOngoingImport />;
  }
  return (
    <AiImportForm
      key={retryJobId ?? 'new'}
      onSubmit={handleSubmit}
      cancelButton={cancelButton}
      lockedPlanTypeId={lockedPlanTypeId}
      defaults={
        retryJobId !== null
          ? statusQuery.data?.retryDefaults ?? {
              planName: statusQuery.data?.planName ?? defaults?.planName,
            }
          : defaults
      }
    />
  );
};
