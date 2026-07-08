'use client';

import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { Button, Icon } from '@tet/ui';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useRouter } from 'next/navigation';
import { ComponentProps, ReactNode, useEffect, useState } from 'react';
import { AiImportProgress } from './ai-import-progress';
import { toImportStepViews } from './ai-import-steps.model';
import { AiImportForm, AiImportFormValues } from './ai-import.form';
import { useEnqueueAiImport } from './data/use-enqueue-ai-import';
import { useGetAiImportStatus } from './data/use-get-ai-import-status';
import { useGetCurrentAiImport } from './data/use-get-current-ai-import';
import { useRedirectToCreatedPlan } from './data/use-redirect-to-created-plan';

const Title = ({
  icon,
  children,
}: {
  icon: ComponentProps<typeof Icon>['icon'];
  children: ReactNode;
}) => (
  <h3 className="mb-8">
    <Icon icon={icon} size="lg" className="mr-2" />
    {children}
  </h3>
);

const Subtitle = ({ children }: { children: ReactNode }) => (
  <p className="mb-8">{children}</p>
);

const BackButton = () => {
  const router = useRouter();
  return (
    <Button
      variant="outlined"
      icon="arrow-left-line"
      type="button"
      onClick={() => router.back()}
    >
      {appLabels.revenirEtapePrecedente}
    </Button>
  );
};

const CheckingOngoingImport = () => (
  <div className="flex justify-center py-10">
    <SpinnerLoader className="w-8 h-8" />
  </div>
);

export const AiImportView = () => {
  const collectiviteId = useCollectiviteId();
  const { setToast } = useToastContext();
  const { data: currentImport, isLoading: isCheckingOngoingImport } =
    useGetCurrentAiImport(collectiviteId);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (currentImport?.jobId) {
      setJobId(currentImport.jobId);
    }
  }, [currentImport?.jobId]);

  const isImportOngoing = jobId !== null;

  const enqueue = useEnqueueAiImport();
  const { data: status } = useGetAiImportStatus(jobId);

  const createdPlanId =
    status?.status === 'done' ? status.createdPlanId : null;
  useRedirectToCreatedPlan(createdPlanId);

  const handleSubmit = async (values: AiImportFormValues) => {
    try {
      const { jobId: newJobId } = await enqueue.mutateAsync({
        collectiviteId,
        file: values.file,
        planName: values.planName,
        planType: values.planType ?? undefined,
        instructions: values.instructions.trim() || undefined,
        withVerifications: values.withVerifications,
        withSousActions: values.withSousActions,
      });
      setJobId(newJobId);
    } catch (error) {
      setToast('error', getErrorMessage(error));
    }
  };

  const renderBody = (): ReactNode => {
    if (isCheckingOngoingImport) {
      return <CheckingOngoingImport />;
    }
    if (isImportOngoing) {
      return (
        <AiImportProgress
          failed={status?.status === 'failed'}
          errorMessage={status?.error ?? null}
          onRetry={() => setJobId(null)}
          steps={toImportStepViews(status?.stepStates)}
        />
      );
    }
    return <AiImportForm onSubmit={handleSubmit} cancelButton={<BackButton />} />;
  };

  return (
    <div className="flex flex-col">
      <Title icon="import-fill">{appLabels.importPlanIaTitre}</Title>
      <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-white rounded-lg">
        <Subtitle>{appLabels.importPlanIaDescription}</Subtitle>
        {renderBody()}
      </div>
    </div>
  );
};
