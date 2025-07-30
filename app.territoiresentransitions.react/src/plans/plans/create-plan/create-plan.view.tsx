'use client';

import { useCollectiviteId } from '@/api/collectivites/collectivite-context';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { useBaseToast } from '@/app/core-logic/hooks/useBaseToast';
import { useCreatePlan } from '@/app/plans/plans/show-plan/data/use-create-plan';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import {
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
} from '@/domain/plans/plans';
import { Icon } from '@/ui';
import { useRouter } from 'next/navigation';

const useGetCreatePlanFunction = () => {
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const { setToast, renderToast } = useBaseToast();

  const { mutate: createPlanAction } = useCreatePlan({
    collectiviteId,
    onSuccess: (data) => {
      router.push(
        makeCollectivitePlanActionUrl({
          collectiviteId: collectiviteId,
          planActionUid: data.id.toString(),
        })
      );
    },
    onError: (error) => {
      setToast('error', error.message);
    },
  });

  const handleSubmit = async ({
    nom,
    typeId,
    referents,
    pilotes,
  }: {
    nom: string;
    typeId: number | null;
    referents: UpdatePlanReferentsSchema[] | null;
    pilotes: UpdatePlanPilotesSchema[] | null;
  }): Promise<void> => {
    await createPlanAction({
      collectiviteId,
      nom,
      typeId: typeId ?? undefined,
      referents: referents ?? undefined,
      pilotes: pilotes ?? undefined,
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  return {
    handleSubmit,
    handleGoBack,
    renderToast,
  };
};

export const CreatePlanView = () => {
  const { handleSubmit, handleGoBack, renderToast } =
    useGetCreatePlanFunction();

  return (
    <div className="flex flex-col">
      <div className="w-full mx-auto">
        <h3 className="mb-8">
          <Icon icon="edit-box-fill" size="lg" className="mr-2" />
          {"Créer un plan d'action"}
        </h3>
        <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-white rounded-lg">
          <UpsertPlanForm
            goBackToPreviousPage={handleGoBack}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
      {renderToast()}
    </div>
  );
};
