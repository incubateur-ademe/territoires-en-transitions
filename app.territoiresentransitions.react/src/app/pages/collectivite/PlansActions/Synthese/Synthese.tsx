import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useState } from 'react';
import FiltersPlanAction, {
  PlanActionFilter,
  filtreToutesLesFiches,
} from './FiltersPlanAction';
import SyntheseGraphsList from './SyntheseGraphsList';
import PageContainer from '@/ui/components/layout/page-container';

/**
 * Contenu de la page Synthèse
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 */

type SyntheseProps = {
  collectiviteId: number;
};

const Synthese = ({ collectiviteId }: SyntheseProps): JSX.Element => {
  const collectivite = useCurrentCollectivite();

  const [selectedPlan, setSelectedPlan] = useState<PlanActionFilter>(
    filtreToutesLesFiches
  );

  return (
    <div data-test="PlansAction" className="w-full">
      <PageContainer
        containerClassName="!bg-primary"
        innerContainerClassName="!py-8"
      >
        <h2 className="mb-0 text-white">Répartition des fiches action</h2>
      </PageContainer>
      <PageContainer bgColor="white">
        {/* Filtres par plan d'actions */}
        <div className="mb-8">
          <FiltersPlanAction
            collectiviteId={collectiviteId}
            onChangePlan={setSelectedPlan}
          />
        </div>

        {/* Graphes répartition des fiches */}
        <SyntheseGraphsList
          collectiviteId={collectiviteId}
          selectedPlan={selectedPlan}
          withoutPlan={selectedPlan.id === 'nc'}
          isReadonly={collectivite?.isReadOnly ?? true}
        />
      </PageContainer>
    </div>
  );
};

export default Synthese;
