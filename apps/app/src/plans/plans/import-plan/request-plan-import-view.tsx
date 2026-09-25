'use client';
import { appLabels } from '@/app/labels/catalog';
import { useRouter } from 'next/navigation';

import { Button, Icon } from '@tet/ui';
import { RequestPlanImportSteps } from './request-plan-import-steps';

export const RequestPlanImportView = () => {
  const router = useRouter();
  const goBackToPreviousPage = () => {
    router.back();
  };
  return (
    <>
      <h3 className="mb-8">
        <Icon icon="import-fill" size="lg" className="mr-2" />
        {appLabels.importerUnPlan}
      </h3>
      <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-white rounded-lg">
        <RequestPlanImportSteps />
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
