import { ReactECharts } from '@/app/ui/charts/echarts/ReactECharts';
import {
  type Dataset,
  makeLegendData,
  makeLineSeries,
  makeOption,
  makeReferenceSeries,
  makeStackedSeries,
} from '@/app/ui/charts/echarts/utils';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import { getAnnee } from '@/app/ui/charts/echarts/utils';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { makeIndicateurPeriodTimeAxis } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import type { GridComponentOption } from 'echarts/components';
import { memo, useMemo, useRef } from 'react';
import { getSourceLabel } from '../data/get-source-label';
import { PreparedData } from '../data/prepare-data';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import {
  GetColorBySourceId,
  useGetColorBySourceId,
} from '../data/use-indicateur-sources';
import { DataSourceTooltipContent } from '../Indicateur/detail/DataSourceTooltip';
import { SourceType } from '../types';
import { LAYERS } from './layer-parameters';
import { prepareReferenceObjectifsDataset } from './prepare-reference-objectifs-dataset';
import { useResizeGraphOnContainerSizeUpdate } from './use-resize-graph-on-container-size-update';

type ChartVariant = 'thumbnail' | 'modal' | 'detail';

const variantToHeight: Record<ChartVariant, number> = {
  thumbnail: 320,
  modal: 550,
  detail: 450,
};

const variantToGrid: Record<ChartVariant, GridComponentOption> = {
  thumbnail: { bottom: 0, right: '5%' },
  modal: {},
  detail: { left: 32, right: 32, bottom: 80 },
};

const variantToStyle: Record<ChartVariant, { height: number }> = {
  thumbnail: { height: variantToHeight.thumbnail },
  modal: { height: variantToHeight.modal },
  detail: { height: variantToHeight.detail },
};

const TooltipContainerClassname =
  'max-w-80 break-words whitespace-normal text-xs [&_*]:text-xs [&_*]:mb-0';

type IndicateurDataset = Dataset & {
  calculAuto: boolean;
  metadonnee?: PreparedData['sources'][number]['metadonnees'][number] | null;
  nomSource?: string | null;
};

// prépare les données pour l'affichage des lignes objectifs/résultats pour
// chaque source disponible
const prepareDataset = (
  data: IndicateurChartInfo['data'],
  type: SourceType,
  getColorBySourceId: GetColorBySourceId
): IndicateurDataset[] =>
  data.valeurs[`${type}s`].sources
    // filtre les valeurs null/undefined
    ?.map(({ valeurs, ...other }) => ({
      ...other,
      valeurs: valeurs.filter(({ valeur }) => valeur != null),
    }))
    // et les jeux de valeurs vides pour éviter d'avoir dans la légende des
    // items sans données associées
    ?.filter(({ valeurs }) => valeurs?.length > 0)
    .map(({ source, libelle, valeurs, metadonnees }) => {
      const metadonnee = metadonnees?.find((m) => m.sourceId === source);
      return {
        color: getColorBySourceId(source, type),
        id: `${type}-${source}`,
        calculAuto: Boolean(valeurs.some((v) => v.calculAuto)),
        name: getSourceLabel(source, metadonnee?.producteur || libelle, type),
        source: valeurs.map(({ dateValeurISO, valeur }) => ({
          dateValeurISO,
          valeur: valeur as number,
        })) as Dataset['source'],
        dimensions: ['dateValeurISO', 'valeur'],
        metadonnee,
        nomSource: libelle,
      };
    }) ?? [];

// prépare les données pour l'affichage des surfaces superposées pour
// les segments (sous-indicateurs d'un indicateur composé avec agrégation)
const prepareSegmentsDataset = (
  chartInfo: IndicateurChartInfo
): IndicateurDataset[] => {
  const { data, segmentItemParId } = chartInfo;
  const { segments } = data.valeurs;

  if (!segments?.length) return [];

  // extrait les périodes uniques pour les segments
  const periodes = [
    ...new Map(
      segments.flatMap(({ source }) =>
        source.valeurs.map(({ periode }) => [
          IndicateurPeriods.key(periode),
          periode,
        ])
      )
    ).values(),
  ].sort(IndicateurPeriods.compareTotal);

  return segments.map(({ definition, source }) => {
    const metadonnee = source.metadonnees?.find(
      (m) => m.sourceId === source.source
    );
    const { id, name, color } = segmentItemParId.get(definition.id) || {};

    return {
      id,
      name: `${name}${source.type === 'objectif' ? ' (objectifs)' : ''}`,
      color,
      calculAuto: Boolean(source.valeurs.some((v) => v.calculAuto)),
      source: periodes.map((periode) => {
        const periodKey = IndicateurPeriods.key(periode);
        const valeur = source.valeurs.find(
          (v) => IndicateurPeriods.key(v.periode) === periodKey
        );
        // Une période absente reste un trou : 0 est une donnée métier valide.
        return (
          valeur ?? {
            dateValeurISO: `${IndicateurPeriods.toDateValeur(
              periode
            )}T00:00:00.000Z`,
            valeur: null,
          }
        );
      }) as Dataset['source'],
      dimensions: ['dateValeurISO', 'valeur'],
      metadonnee,
      nomSource: source.libelle,
      typeSource: source.type,
    };
  });
};

// id des dataser pour les valeurs de référence
const DATASET_REFERENCE = ['cible', 'seuil', 'cible-objectifs'];

const makeReferenceDataset = (
  id: 'cible' | 'seuil',
  valeur: number,
  unite: string,
  dateValeurISO: string,
  libelle: string | null
) => ({
  color: LAYERS[id].color,
  id,
  calculAuto: false,
  name: `Valeur ${id === 'seuil' ? 'limite' : id} : ${valeur} ${unite}`,
  source: [{ dateValeurISO, valeur }],
  dimensions: ['dateValeurISO', 'valeur'],
  metadonnee: null,
  nomSource: libelle,
});

// prépare les données pour l'affichage des valeurs références (cible/seuil)
const prepareReferenceDataset = (chartInfo: IndicateurChartInfo) => {
  const {
    data,
    sourceFilter: { valeursReference },
  } = chartInfo;
  if (!valeursReference) return [];

  const { cible, seuil, objectifs, libelle } = valeursReference;
  const { anneeISO: dateValeurISO } = getAnnee();
  const dataset = [];

  // les valeurs cible/seuil n'ont pas d'année
  // alors on ajoute un point uniquement pour l'année courante
  if (cible !== null) {
    dataset.push(
      makeReferenceDataset(
        'cible',
        cible,
        data.unite ?? '',
        dateValeurISO,
        libelle
      )
    );
  }
  if (seuil !== null) {
    dataset.push(
      makeReferenceDataset(
        'seuil',
        seuil,
        data.unite ?? '',
        dateValeurISO,
        libelle
      )
    );
  }
  if (objectifs?.length) {
    dataset.push(
      prepareReferenceObjectifsDataset({
        valeurs: objectifs,
        unite: data.unite ?? '',
        libelle,
      })
    );
  }
  return dataset;
};

/** Props du graphique générique Indicateur */
type IndicateurChartProps = {
  /** Données pour le graphe */
  chartInfo: IndicateurChartInfo;
  /** Titre du graphe */
  title?: string;
  /** Booléen de chargement des données et infos du graphique */
  isLoading: boolean;
  /** Variant du graphe, en fonction du cas d'utilisation */
  variant?: ChartVariant;
  /** ClassName du container */
  className?: string;
};

type PreparedChartProps = Pick<IndicateurChartProps, 'title' | 'variant'> & {
  data: IndicateurChartInfo['data'];
  periodicite: NonNullable<IndicateurChartInfo['data']['periodicite']>;
  periodiciteAffichage?: IndicateurChartInfo['periodiciteAffichage'];
  donneesResultatObjectif: IndicateurDataset[];
  donneesSegments: IndicateurDataset[];
  references: IndicateurDataset[];
};

const PreparedChart = memo(
  ({
    data,
    periodicite,
    periodiciteAffichage,
    donneesResultatObjectif,
    donneesSegments,
    references,
    title,
    variant = 'detail',
  }: PreparedChartProps) => {
    const option = useMemo(() => {
      const dataset = [
        ...donneesResultatObjectif,
        ...donneesSegments,
        ...references,
      ];
      const datasetByName = new Map<
        IndicateurDataset['name'],
        IndicateurDataset
      >();
      for (const item of dataset) {
        // Conserve le premier élément, comme le `find` historique, si deux
        // sources partagent exceptionnellement le même libellé de légende.
        if (!datasetByName.has(item.name)) datasetByName.set(item.name, item);
      }
      const series = [
        ...makeLineSeries(donneesResultatObjectif),
        ...makeStackedSeries(donneesSegments),
        ...makeReferenceSeries(references, variant !== 'thumbnail'),
      ];

      return makeOption({
        option: {
          dataset,
          series,
          grid: variantToGrid[variant],
          title: variant === 'detail' ? { left: 28 } : {},
          legend: {
            show: variant !== 'thumbnail',
            textStyle: variant === 'thumbnail' ? { fontSize: '0.7rem' } : {},
            data:
              variant === 'thumbnail'
                ? makeLegendData(makeLineSeries(donneesResultatObjectif))
                : makeLegendData(series),
            tooltip: {
              show: true,
              formatter: (params) => {
                const item = datasetByName.get(params.name);
                if (
                  item?.nomSource &&
                  DATASET_REFERENCE.includes(item.id as string)
                ) {
                  return `<div class="${TooltipContainerClassname}">${item.nomSource}</div>`;
                }

                return item?.metadonnee
                  ? renderToString(
                      <DataSourceTooltipContent
                        calculAuto={item.calculAuto}
                        metadonnee={item.metadonnee}
                        nomSource={item.nomSource ?? ''}
                        className={TooltipContainerClassname}
                      />
                    )
                  : '';
              },
            },
          },
        },
        titre: title,
        unite: data.unite,
        timeAxis: makeIndicateurPeriodTimeAxis(
          periodicite,
          periodiciteAffichage
        ),
        disableToolbox: variant !== 'modal',
        hideMinMaxLabel:
          (Array.isArray(dataset[0]?.source) ? dataset[0].source.length : 0) <=
            1 &&
          (Array.isArray(dataset[1]?.source) ? dataset[1].source.length : 0) <=
            1,
      });
    }, [
      data.unite,
      donneesResultatObjectif,
      donneesSegments,
      references,
      periodicite,
      periodiciteAffichage,
      title,
      variant,
    ]);

    return <ReactECharts option={option} style={variantToStyle[variant]} />;
  }
);

PreparedChart.displayName = 'PreparedChart';

const IndicateurChart = ({
  chartInfo,
  title,
  isLoading,
  variant = 'detail',
  className,
}: IndicateurChartProps) => {
  const { data } = chartInfo;
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const getColorBySourceId = useGetColorBySourceId();
  const preparedDatasets = useMemo(() => {
    const donneesResultatObjectif = [
      ...prepareDataset(data, 'resultat', getColorBySourceId),
      ...prepareDataset(data, 'objectif', getColorBySourceId),
    ];
    const donneesSegments = prepareSegmentsDataset(chartInfo);
    const references = prepareReferenceDataset(chartInfo);
    return {
      donneesResultatObjectif,
      donneesSegments,
      references,
      count:
        donneesResultatObjectif.length +
        donneesSegments.length +
        references.length,
    };
  }, [chartInfo, data, getColorBySourceId]);

  useResizeGraphOnContainerSizeUpdate({
    containerRef: chartContainerRef,
    disabled: isLoading || preparedDatasets.count === 0,
  });

  if (preparedDatasets.count === 0 || data.periodicite === undefined)
    return null;

  const style = variantToStyle[variant];

  return (
    <div ref={chartContainerRef} className={className} style={style}>
      {isLoading ? (
        <div className="h-full w-full rounded-lg flex justify-center items-center bg-primary-0">
          <SpinnerLoader className="w-8 h-8 fill-primary-5" />
        </div>
      ) : (
        <PreparedChart
          data={data}
          periodicite={data.periodicite}
          periodiciteAffichage={chartInfo.periodiciteAffichage}
          donneesResultatObjectif={preparedDatasets.donneesResultatObjectif}
          donneesSegments={preparedDatasets.donneesSegments}
          references={preparedDatasets.references}
          title={title}
          variant={variant}
        />
      )}
    </div>
  );
};

export default IndicateurChart;
