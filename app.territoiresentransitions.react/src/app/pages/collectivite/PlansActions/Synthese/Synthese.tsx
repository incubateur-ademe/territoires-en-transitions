import {useState} from 'react';
import HeaderTitle from '../components/HeaderTitle';
import FiltersPlanAction from './FiltersPlanAction';
import SyntheseGraphsList from './SyntheseGraphsList';

/**
 * Contenu de la page Synthèse
 *
 * @param collectiviteId - (number) id de la collectivité affichée
 */

type SyntheseProps = {
  collectiviteId: number;
};

const Synthese = ({collectiviteId}: SyntheseProps): JSX.Element => {
  const [selectedPlan, setSelectedPlan] = useState<{
    id: number | null;
    name: string;
  }>({id: null, name: 'Toutes les fiches'});
  const [withoutPlan, setWithoutPlan] = useState<boolean | null>(null);

  return (
    <div className="w-full">
      <HeaderTitle
        type="plan"
        titre="Synthèse des fiches action"
        isReadonly={true}
      />
      <div className="max-w-4xl mx-auto p-10">
        {/* Filtres par plan d'actions */}
        <FiltersPlanAction
          collectiviteId={collectiviteId}
          onChangePlan={setSelectedPlan}
          onChangeWithoutPlan={setWithoutPlan}
        />

        {/* Graphes répartition des fiches */}
        <SyntheseGraphsList
          collectiviteId={collectiviteId}
          selectedPlan={selectedPlan}
          withoutPlan={withoutPlan}
        />
      </div>
    </div>
  );
};

export default Synthese;
