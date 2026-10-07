'use client';
import { appLabels } from '@/app/labels/catalog';
import { CreatePlanOptionLinksList } from '@/app/plans/plans/create-plan/components/create-plan-option-link.list.tsx';
import { useCollectiviteId } from '@tet/api/collectivites';

export const CreatePlanOptionsView = () => {
  const collectiviteId = useCollectiviteId();

  return (
    <div className="text-center">
      <h3 className="mb-4">{appLabels.creerPlan}</h3>
      <p className="text-lg text-grey-6">{appLabels.vousSouhaitez}</p>
      <CreatePlanOptionLinksList collectiviteId={collectiviteId} />
    </div>
  );
};
