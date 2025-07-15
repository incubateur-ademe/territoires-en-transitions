'use client';

import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { useCreatePlanAction } from '@/app/plans/plans/show-detailed-plan/data/use-upsert-axe';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import { Icon } from '@/ui';
import { useRouter } from 'next/navigation';

export const CreatePlanView = () => {
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const goBackToPreviousPage = () => {
    router.back();
  };
  const { mutate: createPlanAction } = useCreatePlanAction();

  return (
    <div className="flex flex-col">
      <div className="w-full mx-auto">
        <h3 className="mb-8">
          <Icon icon="edit-box-fill" size="lg" className="mr-2" />
          Créer un plan d’action
        </h3>
        <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-white rounded-lg">
          <UpsertPlanForm
            goBackToPreviousPage={goBackToPreviousPage}
            onSubmit={({ nom, type }) => {
              createPlanAction({
                collectivite_id: collectiviteId,
                nom,
                type: type?.id,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};
