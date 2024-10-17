import { referentielToName } from 'app/labels';
import {
  makeCollectiviteTousLesIndicateursUrl,
  ReferentielParamOption,
} from 'app/paths';
import { PictoIndicateurs } from 'ui/pictogrammes/PictoIndicateur';
import { Button } from '@tet/ui';
import { useIndicateursCount } from '../data/useIndicateurSummary';
import { useFonctionTracker } from 'core-logic/hooks/useFonctionTracker';
import { useOpenDataIndicateursCount } from '../data/useOpenDataIndicateurs';
import AccueilCard from '@tet/app/pages/collectivite/EtatDesLieux/Accueil/EtatDesLieux/AccueilCard';

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

  const { cae, eci } = indicateurs;

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
  ];

  const pickIndicateur = (
    indicateursToDisplay: IndicateurToDisplayProps[],
    referentielId: ReferentielParamOption
  ): IndicateurToDisplayProps[] => {
    const indicateur = indicateursToDisplay.find(
      (indicateur) =>
        indicateur.secondLegend &&
        indicateur.secondLegend === referentielToName[referentielId]
    );
    /**
     * Wrapping in an array to respect KeyNumbers component contract
     */
    return indicateur ? [indicateur] : [];
  };

  const isDisplayingIndicateurs =
    indicateurs.cae?.withValue || indicateurs.eci?.withValue;

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

  const { data: openDataIndicateursCount } =
    useOpenDataIndicateursCount(referentielId);

  return (
    <AccueilCard className="grow flex flex-col">
      <div
        className={`grid md:grid-cols-${indicateurs.length} md:divide-x md:divide-y-0 divide-x-0 divide-y divide-[#e5e5e5] md:mb-auto mb-8 md:pb-4 w-fit`}
      >
        {indicateurs.map((v, index) => (
          <div
            key={index}
            className="px-4 md:py-0 py-8 md:first:pl-0 first:pt-0 md:last:pr-0 last:pb-0"
          >
            <div className="text-[#ff5655] text-4xl font-bold pb-2">
              {v.value}/{v.totalValue}
            </div>
            <div>
              <span className="text-sm text-primary-9 font-semibold uppercase">
                {v.firstLegend} {v.secondLegend}
              </span>
              <span className="text-xs">
                {' '}
                dont {openDataIndicateursCount} renseignés en open data
              </span>
            </div>
          </div>
        ))}
      </div>
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
        {openDataIndicateursCount !== 0 && (
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
        )}
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
    <AccueilCard className="grow grid md:grid-cols-3 gap-8">
      <div className="m-auto">
        <PictoIndicateurs />
      </div>
      <div className="md:col-span-2 flex flex-col justify-end">
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
      </div>
    </AccueilCard>
  );
};
