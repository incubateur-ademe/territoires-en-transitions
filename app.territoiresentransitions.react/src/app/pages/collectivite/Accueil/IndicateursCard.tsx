import {referentielToName} from 'app/labels';
import {makeCollectiviteTousLesIndicateursUrl} from 'app/paths';
import ButtonWithLink from 'ui/buttons/ButtonWithLink';
import {PictoIndicateurs} from 'ui/pictogrammes/PictoIndicateur';
import AccueilCard from './AccueilCard';
import AccueilEmptyCardWithPicto from './AccueilEmptyCardWithPicto';
import {useIndicateursCount} from './data/useIndicateurSummary';
import KeyNumbers from 'ui/score/KeyNumbers';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';

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

const IndicateursCard = ({collectiviteId}: IndicateursCardProps) => {
  const indicateurs = useIndicateursCount();
  if (!indicateurs) {
    return null;
  }
  const {cae, eci, perso} = indicateurs;

  const indicateursToDisplay = [
    {
      value: cae?.withValue,
      totalValue: cae?.total,
      firstLegend: 'indicateurs',
      secondLegend: referentielToName.cae,
    },
    {
      value: eci?.withValue,
      totalValue: eci?.total,
      firstLegend: 'indicateurs',
      secondLegend: referentielToName.eci,
    },
    {
      value: perso?.total || 0,
      firstLegend: `indicateur${perso?.total > 1 ? 's' : ''}`,
      secondLegend: `personnalisé${perso?.total > 1 ? 's' : ''}`,
    },
    // {
    //   value: indicateurs.crte.withValue,
    //   totalValue: indicateurs.crte.total,
    //   firstLegend: "indicateurs",
    //   secondLegend: 'CRTE',
    // },
  ];

  const isDisplayingIndicateurs =
    indicateurs.cae?.withValue ||
    indicateurs.eci?.withValue ||
    // indicateurs.crte?.withValue ||
    indicateurs.perso?.total;

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
  const tracker = useFonctionTracker();

  return (
    <AccueilCard className="grow flex flex-col">
      <KeyNumbers valuesList={indicateurs} />
      <ButtonWithLink
        onClick={() => tracker({fonction: 'cta_indicateur', action: 'clic'})}
        href={makeCollectiviteTousLesIndicateursUrl({collectiviteId})}
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
  const tracker = useFonctionTracker();

  return (
    <AccueilEmptyCardWithPicto picto={<PictoIndicateurs />}>
      <>
        <p className="text-sm m-0 pb-12">
          <b>Mesurez</b> l'efficacité de vos actions et{' '}
          <b>atteignez vos objectifs !</b>
        </p>
        <ButtonWithLink
          onClick={() => tracker({fonction: 'cta_indicateur', action: 'clic'})}
          href={makeCollectiviteTousLesIndicateursUrl({collectiviteId})}
          rounded
        >
          Compléter mes indicateurs
        </ButtonWithLink>
      </>
    </AccueilEmptyCardWithPicto>
  );
};
