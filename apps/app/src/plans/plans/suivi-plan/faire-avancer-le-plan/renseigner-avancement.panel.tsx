import { appLabels } from '@/app/labels/catalog';
import { Icon } from '@tet/ui';
import { useListFichesARenseigner } from '../data/use-list-fiches-a-renseigner';
import { FicheARenseignerCard } from './fiche-a-renseigner.card';

export const RenseignerAvancementPanel = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const fiches = useListFichesARenseigner({ collectiviteId, planId });

  return (
    <div
      className="flex flex-col gap-4"
      data-test="plans.suivi.renseigner-avancement"
    >
      <p className="mb-0 text-sm text-grey-8">
        {appLabels.renseignerAvancementSousTitre}
      </p>
      {fiches === undefined ? (
        <div className="flex justify-center p-12">
          <Icon icon="loader-4-line" className="animate-spin text-grey-6" />
        </div>
      ) : fiches.length === 0 ? (
        <p className="mb-0 text-sm text-grey-8">
          {appLabels.renseignerAvancementAucuneAction}
        </p>
      ) : (
        fiches.map((fiche) => (
          <FicheARenseignerCard
            key={fiche.id}
            collectiviteId={collectiviteId}
            planId={planId}
            fiche={fiche}
          />
        ))
      )}
    </div>
  );
};
