'use client';
import { useCollectiviteId } from '@/api/collectivites';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { CreatePlanOptionLinksList } from '@/app/plans/plans/create-plan/components/create-plan-option-link.list.tsx';

export const CreatePlanOptionsView = () => {
  const collectiviteId = useCollectiviteId();
  const { panier } = useGetCollectivitePanierInfo(collectiviteId);

  return (
    <div className="text-center">
      <h3 className="mb-4">Créer un plan d’action</h3>
      <p className="text-lg text-grey-6">Vous souhaitez</p>
      <CreatePlanOptionLinksList
        collectiviteId={collectiviteId}
        panierId={panier?.panierId}
      />
    </div>
  );
};
