import {
  makeCollectivitePersoRefUrl,
  makeReferentielLabellisationUrl,
  makeReferentielUrl,
} from '@/app/app/paths';
import { useCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import Chart from '@/app/ui/charts/Chart';
import logoTerritoireEngage from '@/app/ui/logo/logoTerritoireEngage_big.png';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { ReferentielId } from '@/domain/referentiels';
import { Button, Event, useEventTracker } from '@/ui';
import Image from 'next/image';
import { TableOptions } from 'react-table';
import { ProgressionRow } from '../../DEPRECATED_scores.types';
import { AccueilCard } from '../AccueilCard';
import { getAggregatedScore } from '../utils';
import LabellisationInfo from './LabellisationInfo';

type ScoreRempliProps = {
  isReadonly: boolean;
  collectiviteId: number;
  referentiel: ReferentielId;
  title: string;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  potentiel: number | undefined;
};

/** Carte "état des lieux" avec au moins 1 statut renseigné */
export const ScoreRempli = ({
  isReadonly,
  collectiviteId,
  referentiel,
  title,
  progressionScore,
  potentiel,
}: ScoreRempliProps): JSX.Element => {
  const tracker = useEventTracker();
  const { parcours, status } = useCycleLabellisation(referentiel);
  const data = getAggregatedScore(progressionScore.data);

  return (
    <AccueilCard className="flex flex-col items-center xl:flex-row xl:justify-between">
      {/* Graphe donut */}
      <div className="w-full max-w-xs xl:order-2">
        <Chart
          donut={{
            chart: {
              data: data.array,
              unit: 'point',
              displayPercentageValue: true,
              centeredElement: potentiel && (
                <div className="text-xs text-primary-10">
                  <div className="mb-1">Potentiel</div>
                  {`${toLocaleFixed(potentiel, 1)} point${
                    potentiel > 1 ? 's' : ''
                  }`}
                </div>
              ),
            },
          }}
        />
      </div>

      <div className="flex flex-col items-center xl:items-start gap-2 shrink-0">
        {/** Référentiel */}
        <div className="flex items-center justify-center gap-3 xl:flex-col xl:items-start xl:gap-0 xl:-mt-3">
          <Image
            src={logoTerritoireEngage}
            alt="Logo Territoire Engage"
            className="w-12 xl:w-24"
          />
          <h6 className="text-lg font-bold uppercase m-0">{title}</h6>
        </div>
        {/* Niveau de labellisation et détails */}
        <LabellisationInfo parcours={parcours} score={data} />

        {/* Call to action */}
        <Button
          onClick={() => tracker(Event.referentiels.viewLabellisation)}
          href={makeReferentielLabellisationUrl({
            collectiviteId,
            referentielId: referentiel,
            labellisationTab: 'suivi',
          })}
          disabled={status === 'audit_en_cours' || status === 'demande_envoyee'}
          size="sm"
        >
          {isReadonly
            ? 'Suivre la labellisation'
            : status === 'audit_en_cours' || status === 'demande_envoyee'
            ? 'Demande envoyée'
            : 'Décrocher les étoiles'}
        </Button>
      </div>
    </AccueilCard>
  );
};

type ScoreVideProps = {
  isReadonly: boolean;
  collectiviteId: number;
  referentiel: ReferentielId;
  title: string;
  tags: { label: string; axeId: string }[];
};

/** Carte "état des lieux" avec 0 statut renseigné */
export const ScoreVide = ({
  isReadonly,
  collectiviteId,
  referentiel,
  title,
  tags,
}: ScoreVideProps): JSX.Element => {
  const tracker = useEventTracker();

  return (
    <AccueilCard className="flex flex-col gap-7">
      {/* En-tête */}
      <div className="flex flex-col items-start xl:-mt-3">
        <Image
          src={logoTerritoireEngage}
          alt="Logo Territoire Engage"
          className="w-24"
        />
        <h6 className="text-lg font-bold uppercase m-0">{title}</h6>
      </div>

      {/* Liste de tags */}
      <ul className="flex flex-wrap gap-4 mb-0">
        {tags.map((tag, index) => (
          <li key={index} className="pb-0">
            <a
              href={makeReferentielUrl({
                collectiviteId,
                referentielId: referentiel,
                referentielTab: 'progression',
                axeId: tag.axeId,
              })}
              className="fr-tag !text-[#ff5655] hover:!bg-[#ffcdc1] !bg-[#fddfd8]"
            >
              {tag.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Call to action */}
      <div className="flex flex-col md:flex-row gap-4">
        <Button
          size="sm"
          onClick={() => tracker(Event.referentiels.startEtatLieux)}
          href={makeReferentielUrl({
            collectiviteId,
            referentielId: referentiel,
            referentielTab: 'progression',
          })}
        >
          {isReadonly ? "Voir l'état des lieux" : "Commencer l'état des lieux"}
        </Button>
        <Button
          size="sm"
          onClick={() => tracker(Event.referentiels.personalizeReferentiel)}
          href={makeCollectivitePersoRefUrl({ collectiviteId })}
        >
          {isReadonly
            ? 'Voir la personnalisation du référentiel'
            : 'Personnaliser le référentiel'}
        </Button>
      </div>
    </AccueilCard>
  );
};
