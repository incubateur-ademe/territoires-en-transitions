import { referentielToName } from '@/app/app/labels';
import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { useFonctionTracker } from '@/app/core-logic/hooks/useFonctionTracker';
import { ReferentielId } from '@/domain/referentiels';
import { Button } from '@/ui';
import { AccueilCard } from './AccueilCard';
import { useIndicateurSummary } from './useIndicateurSummary';
import { useOpenDataIndicateursCount } from './useOpenDataIndicateurs';

type IndicateursCardProps = {
  isReadonly: boolean;
  collectiviteId: number;
  referentielId: ReferentielId;
};

/**
 * Carte "indicateurs" de la synthèse de l'état des lieux.
 */
const IndicateursCard = ({
  isReadonly,
  collectiviteId,
  referentielId,
}: IndicateursCardProps) => {
  const tracker = useFonctionTracker();

  const { data: summary } = useIndicateurSummary(referentielId);

  const { data: openDataIndicateursCount } =
    useOpenDataIndicateursCount(referentielId);

  if (!summary) {
    return null;
  }

  const sum = summary[0];

  return (
    <AccueilCard className="flex flex-col gap-2">
      <div className="text-[#ff5655] text-4xl font-bold">
        {sum.rempli}/{sum.nombre}
      </div>
      <div>
        <span className="text-sm text-primary-9 font-semibold uppercase">
          Indicateurs {referentielToName[referentielId]}
        </span>
        <span className="text-xs">
          {' '}
          dont {openDataIndicateursCount} renseignés en open data
        </span>
      </div>
      <div className="flex flex-row gap-4 mt-3">
        <Button
          onClick={() =>
            tracker({ fonction: 'cta_indicateur', action: 'clic' })
          }
          href={`${makeCollectiviteTousLesIndicateursUrl({
            collectiviteId,
          })}?cat=${referentielId}`}
          size="sm"
        >
          {isReadonly ? 'Voir les indicateurs' : 'Compléter mes indicateurs'}
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
            Voir les indicateurs disponibles en open data
          </Button>
        )}
      </div>
    </AccueilCard>
  );
};

export default IndicateursCard;
