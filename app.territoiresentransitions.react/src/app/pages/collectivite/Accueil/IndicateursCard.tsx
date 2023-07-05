import {referentielToName} from 'app/labels';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import ButtonWithLink from 'ui/buttons/ButtonWithLink';
import {PictoIndicateurs} from 'ui/pictogrammes/PictoIndicateurs';
import {usePlansActionsListe} from '../PlansActions/PlanAction/data/usePlansActionsListe';
import AccueilCard from './AccueilCard';
import AccueilEmptyCardWithPicto from './AccueilEmptyCardWithPicto';
import {useIndicateursCount} from './data/useIndicateurSummary';
import KeyNumbers from '../../../../ui/score/KeyNumbers';

type IndicateursCardProps = {
  collectiviteId: number;
};

type FilledIndicateursCardProps = {
  collectiviteId: number;
  indicateurs: {
    value: number;
    totalValue?: number;
    firstLegend: string;
    secondLegend?: string;
  }[];
};

type EmptyIndicateursCardProps = {
  collectiviteId: number;
};

/**
 * Carte "indicateurs"
 */

const IndicateursCard = ({
  collectiviteId,
}: IndicateursCardProps): JSX.Element => {
  const indicateurs = useIndicateursCount();

  const indicateursToDisplay = [
    {
      value: indicateurs.cae.withValue,
      totalValue: indicateurs.cae.total,
      firstLegend: 'indicateurs',
      secondLegend: referentielToName.cae,
    },
    {
      value: indicateurs.eci.withValue,
      totalValue: indicateurs.eci.total,
      firstLegend: 'indicateurs',
      secondLegend: referentielToName.eci,
    },
    {
      value: indicateurs.perso.total,
      firstLegend: `indicateur${indicateurs.perso.total > 1 ? 's' : ''}`,
      secondLegend: `personnalisé${indicateurs.perso.total > 1 ? 's' : ''}`,
    },
    // {
    //   value: indicateurs.crte.withValue,
    //   totalValue: indicateurs.crte.total,
    //   firstLegend: "indicateurs",
    //   secondLegend: 'CRTE',
    // },
  ];

  const isDisplayingIndicateurs =
    indicateurs.cae.withValue ||
    indicateurs.eci.withValue ||
    // indicateurs.crte.withValue ||
    indicateurs.perso.total;

  return isDisplayingIndicateurs ? (
    <FilledIndicateursCard
      collectiviteId={collectiviteId}
      indicateurs={indicateursToDisplay}
    />
  ) : (
    <EmptyIndicateursCard collectiviteId={collectiviteId} />
  );
};

export default IndicateursCard;

/**
 * Carte "indicateurs" avec au moins 1 indicateur renseigné
 */

const FilledIndicateursCard = ({
  collectiviteId,
  indicateurs,
}: FilledIndicateursCardProps): JSX.Element => {
  return (
    <AccueilCard className="flex flex-col">
      <KeyNumbers valuesList={indicateurs} />
      <ButtonWithLink
        href={makeCollectiviteIndicateursUrl({
          collectiviteId,
          indicateurView: 'perso',
        })}
        rounded
      >
        Compléter mes indicateurs
      </ButtonWithLink>
    </AccueilCard>
  );
};

/**
 * Carte "indicateurs" avec 0 indicateur renseigné
 */

const EmptyIndicateursCard = ({
  collectiviteId,
}: EmptyIndicateursCardProps): JSX.Element => {
  const plansActions = usePlansActionsListe(collectiviteId);

  return (
    <AccueilEmptyCardWithPicto picto={<PictoIndicateurs />}>
      <>
        <p className="text-sm m-0 pb-12">
          <b>Mesurez</b> l'efficacité de vos actions et{' '}
          <b>atteignez vos objectifs !</b>
        </p>
        <ButtonWithLink
          href={makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView:
              plansActions && plansActions.plans && plansActions.plans.length
                ? 'perso'
                : 'cae',
          })}
          rounded
        >
          Compléter mes indicateurs
        </ButtonWithLink>
      </>
    </AccueilEmptyCardWithPicto>
  );
};
