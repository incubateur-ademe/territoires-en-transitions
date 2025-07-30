import { useCollectiviteId } from '@/api/collectivites';
import { TScoreAuditRowData } from '@/app/referentiels/audits/AuditComparaison/types';
import { ProgressionRow } from '@/app/referentiels/DEPRECATED_scores.types';
import TagFilters from '@/app/ui/shared/filters/TagFilters';
import { ReferentielId } from '@/domain/referentiels';
import { Breadcrumbs, Event, useEventTracker } from '@/ui';
import { BarDatum } from '@nivo/bar';
import { useEffect, useState } from 'react';
import { TableOptions } from 'react-table';
import { getIndexTitles } from '../utils';
import ChartCard from './ChartCard';

const typeToIndexby: Record<string, string> = {
  axe: 'axe',
  'sous-axe': 'sous-axe',
  action: 'mesure',
  'sous-action': 'sous-mesure',
  tache: 'tâche',
};

export type TBarChartScoreTable =
  | Pick<
      TableOptions<ProgressionRow>,
      'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
    >
  | Pick<
      TableOptions<TScoreAuditRowData>,
      'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
    >;

type BarChartCardWithSubrowsProps = {
  referentiel: ReferentielId;
  percentage?: boolean;
  score: TBarChartScoreTable;
  chartProps: {
    keys: string[];
    layout?: 'horizontal' | 'vertical';
    groupMode?: 'grouped' | 'stacked';
    inverted?: boolean;
    customColors?: { [key: string]: string };
  };
  chartInfo?: {
    title?: string;
    subtitle?: string;
    legend?: { name: string; color: string }[];
    legendOnOverview?: boolean;
    expandable?: boolean;
    downloadable?: boolean;
    additionalInfo?: boolean;
  };
  customStyle?: React.CSSProperties;
  getFormattedScore: (
    scoreData: readonly ProgressionRow[] | readonly TScoreAuditRowData[],
    indexBy: string,
    percentage: boolean,
    customColors: { [key: string]: string }
  ) => { [key: string]: string | number | null }[];
};

const BarChartCardWithSubrows = ({
  referentiel,
  percentage,
  score,
  chartProps,
  chartInfo,
  customStyle,
  getFormattedScore,
}: BarChartCardWithSubrowsProps): JSX.Element => {
  // Associe la data des scores à un nom d'affichage pour le breadcrumb
  const [scoreBreadcrumb, setScoreBreadcrumb] = useState([
    { scoreData: score.data, name: 'Tous les axes', fileName: 'referentiel' },
  ]);

  // Donnée actuellement observée dans le tableau scoreBreadcrumb
  const [indexBy, setIndexBy] = useState('');

  // Mode d'affichage du graphe (abolue / relatif)
  const [relativeMode, setRelativeMode] = useState(percentage ?? false);

  // Mise à jour lors du changement de valeur des scores en props
  useEffect(() => {
    setScoreBreadcrumb([
      { scoreData: score.data, name: 'Tous les axes', fileName: 'referentiel' },
    ]);
    setIndexBy(score.data[0]?.type ? typeToIndexby[score.data[0].type] : '');
  }, [score.data]);

  // Affichage de l'axe enfant
  const handleOpenChildIndex = (index: string | number) => {
    const { scoreData } = scoreBreadcrumb[scoreBreadcrumb.length - 1];

    if (score.getSubRows !== undefined) {
      const relativeIndex = scoreData.findIndex(
        (d) => d.identifiant === index.toString()
      );
      const currentRow = scoreData[relativeIndex];

      if (currentRow) {
        // @ts-expect-error TODO: fix this
        const subRows = score.getSubRows(currentRow, relativeIndex);
        if (!!subRows && subRows.length > 0) {
          setScoreBreadcrumb((prevScoreBreadcrumb) => [
            ...prevScoreBreadcrumb,
            {
              scoreData: subRows,
              name: `${
                indexBy.charAt(0).toUpperCase() + indexBy.slice(1)
              } ${index.toString()}`,
              fileName: indexBy,
            },
          ]);
          setIndexBy(typeToIndexby[subRows[0].type]);
        }
      }
    }
  };

  // Affichage d'un axe parent
  const handleOpenParentIndex = (index: number) => {
    const newScore = scoreBreadcrumb.slice(0, index + 1);
    setScoreBreadcrumb(newScore);
    setIndexBy(typeToIndexby[newScore[newScore.length - 1].scoreData[0].type]);
  };

  // Props du graphe
  const localChartProps = {
    data: getFormattedScore(
      scoreBreadcrumb[scoreBreadcrumb.length - 1].scoreData,
      indexBy,
      relativeMode,
      chartProps.customColors ?? {}
    ),
    indexBy: indexBy,
    keys: chartProps.keys,
    indexTitles: getIndexTitles(
      scoreBreadcrumb[scoreBreadcrumb.length - 1].scoreData,
      relativeMode
    ),
    layout: chartProps.layout,
    groupMode: chartProps.groupMode,
    inverted: chartProps.inverted,
    customColors: !!chartProps.customColors,
    unit: relativeMode ? '%' : 'points',
    onSelectIndex: handleOpenChildIndex,
  };

  // Infos du graphe
  const fileName = `${referentiel}-${
    scoreBreadcrumb[scoreBreadcrumb.length - 1].fileName
  }${
    indexBy === 'axe'
      ? ''
      : `${scoreBreadcrumb[scoreBreadcrumb.length - 1].name
          .split('.')
          .join('-')}`
  }-${relativeMode ? 'pourcentage' : 'points'}`;

  const localChartInfo = {
    title: chartInfo?.title
      ? `${chartInfo.title} ${indexBy ? `par ${indexBy}` : ''} : ${
          relativeMode ? 'pourcentages' : 'nombre de points'
        }`
      : undefined,
    subtitle: chartInfo?.subtitle,
    legend: chartInfo?.legend,
    legendOnOverview: chartInfo?.legendOnOverview,
    expandable: chartInfo?.expandable,
    downloadedFileName: chartInfo?.downloadable ? fileName : undefined,
    additionalInfo: chartInfo?.additionalInfo
      ? getIndexTitles(
          scoreBreadcrumb[scoreBreadcrumb.length - 1].scoreData,
          false
        )
      : undefined,
  };

  const trackEvent = useEventTracker();
  const collectiviteId = useCollectiviteId();

  return (
    <ChartCard
      chartType="bar"
      chartProps={{
        ...localChartProps,
        data: localChartProps.data as BarDatum[],
      }}
      chartInfo={localChartInfo}
      topElement={(id?: string): JSX.Element => (
        <div className="flex flex-col gap-4 w-full">
          <div
            style={{
              visibility: scoreBreadcrumb.length > 1 ? 'visible' : 'hidden',
            }}
          >
            <Breadcrumbs
              size="xs"
              items={scoreBreadcrumb.map((currentScore) => ({
                label: currentScore.name,
              }))}
              onClick={handleOpenParentIndex}
            />
          </div>
          {percentage === undefined && (
            <TagFilters
              options={[
                { value: 'absolue', label: 'Valeur absolue (points)' },
                { value: 'relative', label: 'Valeur relative (%)' },
              ]}
              defaultOption={relativeMode ? 'relative' : 'absolue'}
              small
              onChange={(value: string) =>
                setRelativeMode(value === 'relative')
              }
            />
          )}
        </div>
      )}
      customStyle={customStyle}
      onOpenModal={() =>
        collectiviteId &&
        trackEvent(Event.viewGraphZoom, {
          referentiel,
          type: relativeMode ? 'percentage' : 'points',
        })
      }
      onDownload={() =>
        collectiviteId &&
        trackEvent(Event.downloadGraph, {
          referentiel,
          type: relativeMode ? 'percentage' : 'points',
        })
      }
    />
  );
};

export default BarChartCardWithSubrows;
