'use client';

import { appLabels } from '@/app/labels/catalog';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useUser } from '@tet/api/users';
import { hasPermission } from '@tet/domain/users';
import { Button } from '@tet/ui';
import { JSX } from 'react';
import { useResumeAiImport } from './data/use-resume-ai-import';

/** Sur la page d'un plan en échec : l'équipe reprend l'import qui l'a créé. */
export const ResumeAiImportButton = ({
  planId,
}: {
  planId: number;
}): JSX.Element | null => {
  const trpc = useTRPC();
  const canResume = hasPermission(useUser(), 'plans.fiches.import_resume');
  const { data: resumable } = useQuery(
    trpc.plans.aiImport.findResumableAiImport.queryOptions(
      { planId },
      { enabled: canResume }
    )
  );
  const resume = useResumeAiImport();

  if (!canResume || !resumable) {
    return null;
  }
  return (
    <Button
      onClick={() => resume.mutate({ jobId: resumable.jobId })}
      disabled={resume.isPending}
      data-test="plans.import-ia.reprendre-plan-button"
    >
      {appLabels.importPlanIaReprendre}
    </Button>
  );
};
