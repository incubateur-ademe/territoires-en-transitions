'use client';
import { appLabels } from '@/app/labels/catalog';
import { useRouter } from 'next/navigation';

import { Button, PageHeader } from '@tet/ui';
import { RequestPlanImportInfo } from './request-plan-import.info';

export const RequestPlanImportView = () => {
  const router = useRouter();
  const goBackToPreviousPage = () => {
    router.back();
  };
  return (
    <>
      <PageHeader>
        <PageHeader.Title>{appLabels.importerUnPlan}</PageHeader.Title>
      </PageHeader>
      <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-white rounded-lg">
        <RequestPlanImportInfo />
        <div className="h-[1px] my-8 bg-gray-300" />

        <div className="flex gap-6 mt-3">
          <Button
            variant="outlined"
            icon="arrow-left-line"
            size="sm"
            onClick={goBackToPreviousPage}
            type="button"
          >
            {appLabels.annuler}
          </Button>
        </div>
      </div>
    </>
  );
};
