import {useState} from 'react';
import HeaderTitle from 'ui/HeaderTitle';
import FiltersPlanAction, {
  PlanActionFilter,
  filtreToutesLesFiches,
} from './FiltersPlanAction';
import SyntheseGraphsList from './SyntheseGraphsList';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

/**
 * Contenu de la page Synthèse
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 */

type SyntheseProps = {
  collectiviteId: number;
};

const Synthese = ({collectiviteId}: SyntheseProps): JSX.Element => {
  const collectivite = useCurrentCollectivite();

  const [selectedPlan, setSelectedPlan] = useState<PlanActionFilter>(
    filtreToutesLesFiches
  );

  return (
    <div className="w-full">
      <HeaderTitle
        customClass={{text: 'text-[2rem]'}}
        titre="Répartition des fiches action"
        isReadonly={true}
      />
      <div className="mx-auto p-10">
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
          isReadonly={collectivite?.readonly ?? true}
        />
      </div>
    </div>
  );
};

export default Synthese;
