import {useState} from 'react';
import HeaderTitle from '../components/HeaderTitle';
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
        customClass={{
          container: 'bg-indigo-200',
          text: 'text-[2rem] text-gray-800 placeholder:text-gray-800 focus:placeholder:text-gray-500 disabled:text-gray-800',
        }}
        titre="Synthèse des fiches action"
        isReadonly={true}
      />
      <div className="max-w-4xl mx-auto p-10">
        <div className="mb-6">
          {/* Filtres par plan d'actions */}
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
