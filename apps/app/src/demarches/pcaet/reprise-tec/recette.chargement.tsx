'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { EmptyCard } from '@tet/ui';
import { ReactNode } from 'react';

export const RecetteChargement = ({
  isLoading,
  isPreconditionFailed,
  children,
}: {
  isLoading: boolean;
  isPreconditionFailed: boolean;
  children: ReactNode;
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <SpinnerLoader />
      </div>
    );
  }
  if (isPreconditionFailed) {
    return (
      <EmptyCard
        dataTest="admin.reprise-tec.recette-non-construite"
        title={appLabels.repriseTecRecetteNonConstruite}
        description={appLabels.repriseTecRecetteNonConstruiteDescription}
      />
    );
  }
  return children;
};
