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
        <UpsertPlanForm
          goBackToPreviousPage={goBackToPreviousPage}
          onSubmit={(data) => {
            createPlanAction({
              collectivite_id: collectiviteId,
              nom: data.nom,
              type: data.type?.id ?? null,
            });
          }}
        />
      </div>
    </div>
  );
};
