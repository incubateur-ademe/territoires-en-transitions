import {useParams} from 'react-router-dom';

import PlanActionHeader from './PlanActionHeader';
import PlanActionAxe from './PlanActionAxe';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import {AxeActions} from './AxeActions';
import FicheActionCard from '../FicheAction/FicheActionCard';

import {makeCollectivitePlanActionFicheUrl} from 'app/paths';
import {usePlanAction} from './data/usePlanAction';
import {useEditAxe} from './data/useEditAxe';
import {PlanNode} from './data/types';
import PlanActionFooter from './PlanActionFooter';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import PlanActionFiltres from './PlanActionFiltres/PlanActionFiltres';
import {useFichesActionFiltresListe} from '../FicheAction/data/useFichesActionFiltresListe';
import {checkAxeHasFiche} from './data/utils';
import HeaderTitle from '../components/HeaderTitle';
import PlanActionAxeFiches from './PlanActionAxeFiches';

type PlanActionProps = {
  plan: PlanNode;
  axe?: PlanNode;
};

export const PlanAction = ({plan, axe}: PlanActionProps) => {
  const collectivite = useCurrentCollectivite();

  const isReadonly = collectivite?.readonly ?? false;

  const {mutate: updateAxe} = useEditAxe(plan.id);

  const {items: fichesActionsListe, ...ficheFilters} =
    useFichesActionFiltresListe({plan, axe});

  const displaySousAxe = (node: PlanNode) => (
    <PlanActionAxe
      key={node.id}
      planActionGlobal={plan}
      axe={node}
      displayAxe={displaySousAxe}
      isReadonly={isReadonly}
    />
  );

  return (
    <div data-test="PlanAction" className="w-full">
      <HeaderTitle
        type={axe ? 'axe' : 'plan'}
        titre={axe ? axe.nom : plan.nom}
        onUpdate={nom => updateAxe({id: axe ? axe.id : plan.id, nom})}
        isReadonly={isReadonly}
      />
      <div className="max-w-4xl mx-auto px-10">
        <PlanActionHeader
          collectivite_id={collectivite?.collectivite_id!}
          plan={plan}
          axe={axe}
          isReadonly={isReadonly}
        />
        {/** On vérifie si le plan contient des fiches pour afficher les filtres de fiche */}
        {!axe && checkAxeHasFiche(plan) && (
          <PlanActionFiltres
            itemsNumber={ficheFilters.total}
            initialFilters={ficheFilters.initialFilters}
            filters={ficheFilters.filters}
            setFilters={ficheFilters.setFilters}
          />
        )}
        {/** Si il y a d'autres filtres activés en plus de la collectivite et le plan,
         alors on affiche les fiches filtrées, sinon le plan d'action */}
        {Object.keys(ficheFilters.filters).length > 2 ? (
          fichesActionsListe.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {fichesActionsListe.map(fiche => (
                <FicheActionCard
                  key={fiche.id}
                  ficheAction={fiche}
                  link={makeCollectivitePlanActionFicheUrl({
                    collectiviteId: collectivite!.collectivite_id!,
                    planActionUid: plan.id.toString(),
                    ficheUid: fiche.id!.toString(),
                  })}
                />
              ))}
            </div>
          ) : (
            <div className="mt-16 mb-8">
              Aucune fiche ne correspond à votre recherche
            </div>
          )
        ) : // Affiche les fiches et sous-axes s'il y en a, sinon un état vide
        (!axe &&
            (plan.children.length > 0 ||
              (plan.fiches && plan.fiches.length > 0))) ||
          (axe &&
            (axe.children.length > 0 ||
              (axe.fiches && axe.fiches.length > 0))) ? (
          <>
            <div className="mb-4">
              {!isReadonly && (
                <AxeActions
                  planActionId={plan.id}
                  axeId={axe ? axe.id : plan.id}
                />
              )}
              {/** Affichage des fiches */}
              {((plan.fiches && plan.fiches.length !== 0) ||
                (axe && axe.fiches && axe.fiches.length !== 0)) && (
                <div className="mt-6">
                  <PlanActionAxeFiches
                    ficheIds={axe ? axe.fiches : plan.fiches}
                    axeId={axe ? axe.id : plan.id}
                  />
                </div>
              )}
            </div>
            {/** Affichage des sous-axes */}
            {axe &&
              axe.children &&
              axe.children.length > 0 &&
              axe.children.map(enfant => (
                <PlanActionAxe
                  key={enfant.id}
                  planActionGlobal={axe ? axe : plan}
                  axe={enfant}
                  displayAxe={displaySousAxe}
                  isReadonly={isReadonly}
                />
              ))}
            {!axe &&
              plan.children &&
              plan.children.length > 0 &&
              plan.children.map(enfant => (
                <PlanActionAxe
                  key={enfant.id}
                  planActionGlobal={plan}
                  axe={enfant}
                  displayAxe={displaySousAxe}
                  isReadonly={isReadonly}
                />
              ))}
          </>
        ) : (
          <div>
            <div className="flex flex-col items-center my-8">
              <PictoLeaf className="w-24 fill-gray-400" />
              <div className="my-6 text-gray-500">
                Aucune arborescence pour l'instant
              </div>
              {!isReadonly && (
                <AxeActions
                  planActionId={plan.id}
                  axeId={axe ? axe.id : plan.id}
                />
              )}
            </div>
          </div>
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
