import {
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import classNames from 'classnames';
import {TAxeRow} from 'types/alias';
import ButtonWithLink from 'ui/buttons/ButtonWithLink';
import {statusColor} from 'ui/charts/chartsTheme';
import DonutChart from 'ui/charts/DonutChart';
import {PictoPlansAction} from 'ui/pictogrammes/PictoPlansAction';
import {usePlansActionsListe} from '../PlansActions/PlanAction/data/usePlansActionsListe';
import {usePlanActionTableauDeBord} from '../PlansActions/Synthese/data/usePlanActionTableauDeBord';
import AccueilCard from './AccueilCard';
import AccueilEmptyCardWithPicto from './AccueilEmptyCardWithPicto';
import KeyNumbers from '../../../../ui/score/KeyNumbers';

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
  const planActionsStats = usePlanActionTableauDeBord(
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
      className={classNames({
        'grid md:grid-cols-2 gap-8': nbFiches > 0,
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
        <div className="h-[200px] w-[246px] md:w-[197px] xl:w-[246px] mx-auto md:order-last order-first">
          <DonutChart
            data={
              planActionsStats && planActionsStats.statuts
                ? planActionsStats.statuts.map(st => ({
                    ...st,
                    id: st.id !== 'NC' ? st.id : 'Sans statut',
                    color: statusColor[st.id],
                  }))
                : []
            }
            customMargin={{top: 2, right: 0, bottom: 2, left: 0}}
            zoomEffect={false}
            unit="fiche"
            displayPercentageValue
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
        <ButtonWithLink
          href={makeCollectivitePlansActionsNouveauUrl({collectiviteId})}
          rounded
        >
          Créer ou importer un plan d'action
        </ButtonWithLink>
      </>
    </AccueilEmptyCardWithPicto>
  );
};
