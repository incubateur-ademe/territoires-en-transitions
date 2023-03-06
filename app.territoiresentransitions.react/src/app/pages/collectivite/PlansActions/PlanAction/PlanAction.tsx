import {useParams} from 'react-router-dom';

import PlanActionHeader from './PlanActionHeader';
import PlanActionAxe from './PlanActionAxe';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import {AxeActions} from './AxeActions';
import FicheActionCard from '../FicheAction/FicheActionCard';

import {makeCollectivitePlanActionFicheUrl} from 'app/paths';
import {usePlanAction} from './data/usePlanAction';
import {useEditAxe} from './data/useEditAxe';
import {TPlanAction} from './data/types/PlanAction';
import PlanActionFooter from './PlanActionFooter';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import PlanActionFiltres from './PlanActionFiltres/PlanActionFiltres';
import {useFichesActionFiltresListe} from '../FicheAction/data/useFichesActionFiltresListe';
import {checkAxeHasFiche} from './data/utils';
import HeaderTitle from '../components/HeaderTitle';

type PlanActionProps = {
  plan: TPlanAction;
};

export const PlanAction = ({plan}: PlanActionProps) => {
  const collectivite = useCurrentCollectivite();

  const isReadonly = collectivite?.readonly ?? false;

  const {mutate: updatePlan} = useEditAxe(plan.axe.id);

  const {items: fichesActionsListe, ...ficheFilters} =
    useFichesActionFiltresListe(plan.axe.id);

  const displaySousAxe = (axe: TPlanAction) => (
    <PlanActionAxe
      key={axe.axe.id}
      planActionGlobal={plan}
      axe={axe}
      displayAxe={displaySousAxe}
      isReadonly={isReadonly}
    />
  );

  return (
    <div className="w-full">
      <HeaderTitle
        type="plan"
        titre={plan.axe.nom}
        onUpdate={nom => updatePlan({id: plan.axe.id, nom})}
        isReadonly={isReadonly}
      />
      <div className="max-w-4xl mx-auto px-10">
        <PlanActionHeader
          plan={plan}
          collectivite_id={collectivite?.collectivite_id!}
        />
        {/** On vérifie si le plan contient des fiches pour afficher les filtres de fiche */}
        {checkAxeHasFiche(plan) && (
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
                    planActionUid: plan.axe.id.toString(),
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
        plan.enfants || plan.fiches ? (
          <>
            <div className="mb-4">
              {!isReadonly && (
                <AxeActions planActionId={plan.axe.id} axeId={plan.axe.id} />
              )}
              {/** Affichage des fiches */}
              {plan.fiches && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {plan.fiches.map(fiche => (
                    <FicheActionCard
                      key={fiche.id}
                      ficheAction={fiche}
                      link={makeCollectivitePlanActionFicheUrl({
                        collectiviteId: fiche.collectivite_id!,
                        planActionUid: plan.axe.id.toString(),
                        ficheUid: fiche.id!.toString(),
                      })}
                    />
                  ))}
                </div>
              )}
            </div>
            {/** Affichage des sous-axes */}
            {plan.enfants &&
              plan.enfants.length > 0 &&
              plan.enfants.map(enfant => (
                <PlanActionAxe
                  key={enfant.axe.id}
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
                <AxeActions planActionId={plan.axe.id} axeId={plan.axe.id} />
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

  const {data, isLoading} = usePlanAction(parseInt(planUid));

  return !isLoading && data ? (
    <PlanAction plan={data} />
  ) : (
    <div className="h-[6.75rem] w-full bg-indigo-700 xl:mr-6" />
  );
};

export default PlanActionConnected;
