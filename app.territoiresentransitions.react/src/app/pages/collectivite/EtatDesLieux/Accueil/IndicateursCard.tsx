import { referentielToName } from 'app/labels';
import {
  makeCollectiviteTousLesIndicateursUrl,
  ReferentielParamOption,
} from 'app/paths';
import { PictoIndicateurs } from 'ui/pictogrammes/PictoIndicateur';
import { Button } from '@tet/ui';
import AccueilCard from './AccueilCard';
import AccueilEmptyCardWithPicto from './AccueilEmptyCardWithPicto';
import KeyNumbers from 'ui/score/KeyNumbers';
import { useIndicateursCount } from './data/useIndicateurSummary';
import { useFonctionTracker } from 'core-logic/hooks/useFonctionTracker';
import { useOpenDataIndicateursCount } from './data/useOpenDataIndicateurs';

type IndicateursCardProps = {
  collectiviteId: number;
  referentielId: ReferentielParamOption;
};

type IndicateurToDisplayProps = {
  value: number;
  totalValue?: number;
  firstLegend: string;
  secondLegend?: string;
};

type FilledIndicateursCardProps = {
  collectiviteId: number;
  indicateurs: IndicateurToDisplayProps[];
  referentielId: ReferentielParamOption;
};

type EmptyIndicateursCardProps = {
  collectiviteId: number;
};

/**
 * Carte "indicateurs"
 */

const IndicateursCard = ({
  collectiviteId,
  referentielId,
}: IndicateursCardProps) => {
  const indicateurs = useIndicateursCount();
  if (!indicateurs) {
    return null;
  }

  const { cae, eci, perso } = indicateurs;

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
  ];

  const pickIndicateur = (
    indicateursToDisplay: IndicateurToDisplayProps[],
    referentielId: ReferentielParamOption
  ): IndicateurToDisplayProps[] => {
    const indicateur = indicateursToDisplay.find(
      (indicateur) =>
        indicateur.secondLegend === referentielToName[referentielId]
    );
    if (!indicateur) {
      throw new Error(
        `Indicateur not found for referentielId: ${referentielId}`
      );
    }
    /**
     * Wrapping in an array to respect KeyNumbers contract
     */
    return [indicateur];
  };

  const isDisplayingIndicateurs =
    indicateurs.cae?.withValue ||
    indicateurs.eci?.withValue ||
    indicateurs.perso?.total;

  return isDisplayingIndicateurs ? (
    <FilledIndicateursCard
      collectiviteId={collectiviteId}
      indicateurs={pickIndicateur(indicateursToDisplay, referentielId)}
      referentielId={referentielId}
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
  referentielId,
}: FilledIndicateursCardProps): JSX.Element => {
  const tracker = useFonctionTracker();

  const {
    data: openDataIndicateurs,
    error,
    isLoading,
  } = useOpenDataIndicateursCount(referentielId);

  return (
    <AccueilCard className="grow flex flex-col">
      <div>
        {openDataIndicateurs ? (
          <div>
            {referentielId}
            {openDataIndicateurs}
          </div>
        ) : (
          <div>Aucun indicateur disponible.</div>
        )}
      </div>
      <KeyNumbers valuesList={indicateurs} />
      <div className="flex flex-row gap-4">
        <Button
          onClick={() =>
            tracker({ fonction: 'cta_indicateur', action: 'clic' })
          }
          href={`${makeCollectiviteTousLesIndicateursUrl({
            collectiviteId,
          })}?cat=${referentielId}`}
          size="sm"
        >
          Compléter mes indicateurs
        </Button>
        {/* TO DO: change tracker ? */}
        <Button
          onClick={() =>
            tracker({ fonction: 'cta_indicateur', action: 'clic' })
          }
          href={`${makeCollectiviteTousLesIndicateursUrl({
            collectiviteId,
          })}?cat=${referentielId}&od=true`}
          variant="outlined"
          size="sm"
        >
          Voir les indicateurs complétés en open data
        </Button>
      </div>
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
        <Button
          onClick={() =>
            tracker({ fonction: 'cta_indicateur', action: 'clic' })
          }
          href={makeCollectiviteTousLesIndicateursUrl({ collectiviteId })}
        >
          Compléter mes indicateurs
        </Button>
      </>
    </AccueilEmptyCardWithPicto>
  );
};
