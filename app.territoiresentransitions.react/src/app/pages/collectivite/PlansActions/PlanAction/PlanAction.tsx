import {useState} from 'react';
import {useParams} from 'react-router-dom';

import HeaderTitle from '../components/HeaderTitle';
import PlanActionHeader from './PlanActionHeader';
import PlanActionFooter from './PlanActionFooter';
import PlanActionArborescence from './PlanActionArborescence';
import PlanActionFiltresAccordeon from './PlanActionFiltres/PlanActionFiltresAccordeon';

import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {checkAxeHasFiche} from './data/utils';
import {usePlanAction} from './data/usePlanAction';
import {useEditAxe} from './data/useEditAxe';
import {PlanNode} from './data/types';

type PlanActionProps = {
  plan: PlanNode;
  axe?: PlanNode;
};

export const PlanAction = ({plan, axe}: PlanActionProps) => {
  const collectivite = useCurrentCollectivite();

  const isReadonly = collectivite?.readonly ?? false;

  const isAxePage = axe !== undefined;

  const {mutate: updateAxe} = useEditAxe(plan.id);

  const [isFiltered, setIsFiltered] = useState(false);

  return (
    <div data-test={isAxePage ? 'PageAxe' : 'PlanAction'} className="w-full">
      <HeaderTitle
        customClass={
          isAxePage
            ? {
                container: 'bg-indigo-300',
                text: 'text-[1.75rem] text-gray-800 placeholder:text-gray-800 focus:placeholder:text-gray-500 disabled:text-gray-800',
              }
            : {
                container: 'bg-indigo-700',
                text: 'text-[2rem]',
              }
        }
        titre={isAxePage ? axe.nom : plan.nom}
        onUpdate={nom => updateAxe({id: isAxePage ? axe.id : plan.id, nom})}
        isReadonly={isReadonly}
      />
      <div className="max-w-4xl mx-auto px-10">
        <PlanActionHeader
          collectivite_id={collectivite?.collectivite_id!}
          isAxePage={isAxePage}
          plan={plan}
          axe={axe}
          isReadonly={isReadonly}
        />
        {/** On vérifie si le plan ou l'axe contient des fiches pour afficher les filtres de fiche */}
        {((!isAxePage && checkAxeHasFiche(plan)) ||
          (isAxePage && checkAxeHasFiche(axe))) && (
          <PlanActionFiltresAccordeon
            plan={plan}
            axe={axe}
            setIsFiltered={isFiltered => setIsFiltered(isFiltered)}
          />
        )}
        {!isFiltered && (
          <PlanActionArborescence
            isAxePage={isAxePage}
            plan={plan}
            axe={axe ?? plan}
            isReadonly={isReadonly}
          />
        )}
        <PlanActionFooter plan={plan} isReadonly={isReadonly} />
      </div>
    </div>
  );
};

const PlanActionConnected = () => {
  const {planUid} = useParams<{planUid: string}>();
  const {axeUid} = useParams<{axeUid: string}>();

  const {data: planData, isLoading: planLoading} = usePlanAction(
    parseInt(planUid)
  );
  const {data: axeData, isLoading: axeLoading} = usePlanAction(
    parseInt(axeUid)
  );

  const isLoading = planLoading || axeLoading;

  return !isLoading && planData ? (
    <PlanAction plan={planData} axe={axeData} />
  ) : (
    <div className="h-[6.75rem] w-full bg-indigo-700 xl:mr-6" />
  );
};

export default PlanActionConnected;
