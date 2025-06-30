import { useCollectiviteId } from '@/api/collectivites';
import { useGetCollectivitePanierInfo } from '@/app/collectivites/panier/data/useGetCollectivitePanierInfo';
import { CreatePlanOptionLinksList } from '@/app/plans/plans/create-plan/components/create-plan-option-link.list.tsx';

export const Selection = () => {
  const collectiviteId = useCollectiviteId();
  const { panier } = useGetCollectivitePanierInfo(collectiviteId);

  return (
    <div
      data-test="choix-creation-plan"
      className="max-w-5xl mx-auto flex flex-col grow py-12"
    >
      <div className="flex flex-col py-14 px-24 text-center bg-primary-0">
        <h3 className="mb-4">Créer un plan d’action</h3>
        <p className="text-lg text-grey-6">Vous souhaitez</p>
        <div className="flex justify-between gap-6 mt-4">
          <CreatePlanOptionLinksList
            collectiviteId={collectiviteId}
            panierId={panier?.panierId}
          />
        </div>
      </div>
    </div>
  );
};
