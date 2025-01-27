import { ReferentielParamOption } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ActionReferentiel } from '@/app/referentiels/ReferentielTable/useReferentiel';
import { TActionStatutsRow } from '@/app/types/alias';
import TagFilters from '@/app/ui/shared/filters/TagFilters';
import { Breadcrumbs, useEventTracker } from '@/ui';
import { useEffect, useState } from 'react';
import { TableOptions } from 'react-table';
import { getIndexTitles } from '../utils';
import ChartCard from './ChartCard';
import { TScoreAuditRowData } from '@/app/referentiels/audits/AuditComparaison/types';

export type ProgressionRow = ActionReferentiel &
  Pick<
    TActionStatutsRow,
    | 'action_id'
    | 'score_realise'
    | 'score_programme'
    | 'score_realise_plus_programme'
    | 'score_pas_fait'
    | 'score_non_renseigne'
    | 'points_realises'
    | 'points_programmes'
    | 'points_max_personnalises'
    | 'points_max_referentiel'
  >;

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
  referentiel: ReferentielParamOption;
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
    customColors: {}
  ) => {}[];
  /** pour le tracking */
  pageName: 'app/edl/synthese' | 'app/audit/comparaison';
};

const BarChartCardWithSubrows = ({
  pageName,
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
    setIndexBy(score.data[0]?.type ?? '');
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
        // @ts-ignore
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
          setIndexBy(subRows[0].type);
        }
      }
    }
  };

  // Affichage d'un axe parent
  const handleOpenParentIndex = (index: number) => {
    const newScore = scoreBreadcrumb.slice(0, index + 1);
    setScoreBreadcrumb(newScore);
    setIndexBy(newScore[newScore.length - 1].scoreData[0].type);
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
      ? `${chartInfo.title} ${
          indexBy ? `par ${indexBy === 'tache' ? 'tâche' : indexBy}` : ''
        } : ${relativeMode ? 'pourcentages' : 'nombre de points'}`
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

  const trackEvent = useEventTracker(pageName);
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;

  return (
    <ChartCard
      chartType="bar"
      chartProps={localChartProps}
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
        trackEvent('zoom_graph', {
          collectiviteId,
          niveauAcces,
          role,
          referentiel,
          type: relativeMode ? 'percentage' : 'points',
        })
      }
      onDownload={() =>
        collectiviteId &&
        trackEvent('export_graph', {
          collectiviteId,
          niveauAcces,
          role,
          referentiel,
          type: relativeMode ? 'percentage' : 'points',
        })
      }
    />
  );
};

export default BarChartCardWithSubrows;
