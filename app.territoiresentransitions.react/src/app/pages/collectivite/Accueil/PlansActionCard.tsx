import {useHistory} from 'react-router-dom';
import classNames from 'classnames';

import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectivitePlansActionsSyntheseUrl,
  makeCollectivitePlansActionsSyntheseVueUrl,
} from 'app/paths';
import {TAxeRow} from 'types/alias';
import ButtonWithLink from 'ui/buttons/ButtonWithLink';
import {PictoPlansAction} from 'ui/pictogrammes/PictoPlansAction';
import {usePlansActionsListe} from '../PlansActions/PlanAction/data/usePlansActionsListe';
import {usePlanActionTableauDeBord} from '../PlansActions/Synthese/data/usePlanActionTableauDeBord';
import AccueilCard from './AccueilCard';
import AccueilEmptyCardWithPicto from './AccueilEmptyCardWithPicto';
import KeyNumbers from 'ui/score/KeyNumbers';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {statutToColor} from 'app/pages/collectivite/PlansActions/Synthese/utils';
import Chart from 'ui/charts/Chart';

type PlanActionCardProps = {
  collectiviteId: number;
};

type FilledPlansActionCardProps = {
  collectiviteId: number;
  plans: TAxeRow[];
};

type EmptyPlansActionCardProps = {
  collectiviteId: number;
};

/**
 * Carte "plans d'action"
 */

const PlansActionCard = ({
  collectiviteId,
}: PlanActionCardProps): JSX.Element => {
  const plansActions = usePlansActionsListe(collectiviteId);

  return plansActions?.plans?.length ? (
    <FilledPlansActionCard
      collectiviteId={collectiviteId}
      plans={plansActions?.plans}
    />
  ) : (
    <EmptyPlansActionCard collectiviteId={collectiviteId} />
  );
};

export default PlansActionCard;

/**
 * Carte "plans d'action" quand il y a au moins 1 plan d'action
 */

const FilledPlansActionCard = ({
  collectiviteId,
  plans,
}: FilledPlansActionCardProps): JSX.Element => {
  const tracker = useFonctionTracker();
  const history = useHistory();
  const {data: planActionsStats} = usePlanActionTableauDeBord(
    collectiviteId,
    null,
    null
  );

  const nbFiches = planActionsStats
    ? planActionsStats.statuts.reduce(
        (total, currValue) => total + currValue.value,
        0
      )
    : 0;

  return (
    <AccueilCard
      className={classNames('grow', {
        'grid md:grid-cols-2 gap-4 md:gap-8': nbFiches > 0,
      })}
    >
      <div className="flex flex-col h-full">
        {/* Compteurs nombre plans / nombre fiches */}
        <KeyNumbers
          valuesList={[
            {
              value: plans.length,
              firstLegend: `plan${plans.length > 1 ? 's' : ''} d'action`,
            },
            {
              value: nbFiches,
              firstLegend: `fiche${nbFiches > 1 ? 's' : ''} action`,
            },
          ]}
        />

        {/* Call to action */}
        <ButtonWithLink
          onClick={() => tracker({fonction: 'cta_plan_maj', action: 'clic'})}
          href={
            plans.length === 1
              ? makeCollectivitePlanActionUrl({
                  collectiviteId,
                  planActionUid: `${plans[0].id}`,
                })
              : makeCollectivitePlansActionsSyntheseUrl({collectiviteId})
          }
          rounded
        >
          Mettre à jour {plans.length === 1 ? 'mon' : 'mes'} plan
          {plans.length === 1 ? '' : 's'}
        </ButtonWithLink>
      </div>

      {/* Graphique de répartition par statut */}
      {nbFiches > 0 && (
        <div className="w-full max-w-xs mx-auto order-first md:order-last md:-my-6">
          <Chart
            donut={{
              chart: {
                data:
                  planActionsStats && planActionsStats.statuts
                    ? planActionsStats.statuts.map(st => ({
                        ...st,
                        id: st.id !== 'NC' ? st.id : 'Sans statut',
                        color: statutToColor[st.id],
                      }))
                    : [],
                unit: 'fiche',
                displayPercentageValue: true,
                onClick: () => {
                  history.push(
                    makeCollectivitePlansActionsSyntheseVueUrl({
                      collectiviteId,
                      vue: 'statuts',
                    })
                  );
                },
              },
            }}
          />
        </div>
      )}
    </AccueilCard>
  );
};

/**
 * Carte "plans d'action" quand il y a 0 plan d'action
 */

const EmptyPlansActionCard = ({
  collectiviteId,
}: EmptyPlansActionCardProps): JSX.Element => {
  const tracker = useFonctionTracker();
  const collectivite = useCurrentCollectivite();

  return (
    <AccueilEmptyCardWithPicto picto={<PictoPlansAction />}>
      <>
        <ul className="text-sm m-0 pb-8">
          <li>
            <b>Suivez</b> toutes vos actions sur un seul outil
          </li>
          <li>
            Travaillez de manière <b>collaborative</b>
          </li>
          <li>
            <b>Visualisez votre progression</b> sur les graphiques
          </li>
        </ul>
        {collectivite && !collectivite.readonly && (
          <ButtonWithLink
            onClick={() =>
              tracker({fonction: 'cta_plan_creation', action: 'clic'})
            }
            href={makeCollectivitePlansActionsNouveauUrl({collectiviteId})}
            rounded
          >
            Créer ou importer un plan d'action
          </ButtonWithLink>
        )}
      </>
    </AccueilEmptyCardWithPicto>
  );
};
