'use client';

import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';

export const BackofficeView = () => {
  return (
    <div data-test="backoffice.view">
      <PageHeader>
        <PageHeader.Title>{appLabels.administration}</PageHeader.Title>
      </PageHeader>
    </div>
  );
};
