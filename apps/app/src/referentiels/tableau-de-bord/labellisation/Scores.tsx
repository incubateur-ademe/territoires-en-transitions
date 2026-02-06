import {
  makeCollectivitePersoRefUrl,
  makeReferentielLabellisationUrl,
  makeReferentielUrl,
} from '@/app/app/paths';
import { useCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { EChartsOption, ReactECharts } from '@/app/ui/charts/echarts';
import logoTerritoireEngage from '@/app/ui/logo/logoTerritoireEngage_big.png';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { ReferentielId } from '@tet/domain/referentiels';
import { Button, Event, useEventTracker } from '@tet/ui';
import Image from 'next/image';
import Link from 'next/link';
import { JSX } from 'react';
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

  const chartOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (Array.isArray(params)) return '';
        return `${params.marker} ${params.name}: <b>${params.value} points (${params.percent}%)</b>`;
      },
      textStyle: {
        color: '#222',
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '80%'],
        padAngle: 1,
        minAngle: 0,
        minShowLabelAngle: 10,
        percentPrecision: 0,

        itemStyle: {
          borderRadius: 4,
          borderWidth: 4,
        },
        label: {
          position: 'inside',
          formatter: '{d}%',
          opacity: 0.7,
          fontSize: '0.9rem',
        },
        emphasis: {
          itemStyle: {
            color: 'inherit',
          },
        },
        data: data.array.map((d) => ({
          name: d.id,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
  };

  return (
    <AccueilCard className="flex flex-col items-center xl:flex-row xl:justify-between">
      {/* Graphe donut */}
      <div className="w-full max-w-xs xl:order-2 relative">
        <ReactECharts option={chartOption} style={{ height: 256 }} />
        {!!potentiel && (
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="m-auto text-center text-xs text-primary-10">
              <div className="mb-1">Potentiel</div>
              {`${toLocaleFixed(potentiel, 1)} point${
                potentiel > 1 ? 's' : ''
              }`}
            </div>
          </div>
        )}
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
            <Link
              href={makeReferentielUrl({
                collectiviteId,
                referentielId: referentiel,
                referentielTab: 'progression',
                axeId: tag.axeId,
              })}
              className="text-[#ff5655] hover:bg-[#ffcdc1] bg-[#fddfd8] rounded-full px-3 py-1 text-sm"
            >
              {tag.label}
            </Link>
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
