'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ReactElement } from 'react';
import { useChecklist } from './checklist.context';
import { ChecklistView } from './checklist/index';

export const CriteresLabellisationView = (): ReactElement | null => {
  const { cycle, parcours } = useChecklist();

  if (cycle.isLoading) {
    return (
      <div className="flex h-32">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }

  if (cycle.isError) {
    return <p className="text-error-1">{appLabels.erreurChargementCriteres}</p>;
  }

  if (!parcours) {
    return null;
  }

  return <ChecklistView viewModel={parcours} />;
};
