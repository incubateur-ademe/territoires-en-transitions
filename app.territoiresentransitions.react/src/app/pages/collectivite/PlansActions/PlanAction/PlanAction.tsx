import {useParams} from 'react-router-dom';

import PlanActionHeader from './PlanActionHeader';

import {usePlanAction} from './data/usePlanAction';
import {useEditAxe} from './data/useEditAxe';
import {PlanNode} from './data/types';
import PlanActionFooter from './PlanActionFooter';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import PlanActionFiltres from './PlanActionFiltres/PlanActionFiltres';
import {useFichesActionFiltresListe} from '../FicheAction/data/useFichesActionFiltresListe';
import {checkAxeHasFiche} from './data/utils';
import HeaderTitle from '../components/HeaderTitle';
import PlanActionArborescence from './PlanActionArborescence';

type PlanActionProps = {
  plan: PlanNode;
  axe?: PlanNode;
};

export const PlanAction = ({plan, axe}: PlanActionProps) => {
  const collectivite = useCurrentCollectivite();

  const isReadonly = collectivite?.readonly ?? false;

  const isAxePage = axe !== undefined;

  const {mutate: updateAxe} = useEditAxe(plan.id);

  const {items: fichesActionsListe, ...ficheFilters} =
    useFichesActionFiltresListe({plan, axe});

  // On prend à partir de 2 éléments car
  // les filtres "collectivite_id" et "plan/axe id" sont des constantes
  const isFiltered = Object.keys(ficheFilters.filters).length > 2;

  return (
    <div data-test={isAxePage ? 'PageAxe' : 'PlanAction'} className="w-full">
      <HeaderTitle
        type={isAxePage ? 'axe' : 'plan'}
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
          <PlanActionFiltres
            planId={plan.id.toString()}
            itemsNumber={ficheFilters.total}
            initialFilters={ficheFilters.initialFilters}
            filters={ficheFilters.filters}
            setFilters={ficheFilters.setFilters}
            fichesActionsListe={fichesActionsListe}
            isFiltered={isFiltered}
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
