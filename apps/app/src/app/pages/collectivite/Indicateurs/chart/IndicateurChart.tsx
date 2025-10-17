import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import {
  ReactECharts,
  makeLegendData,
  makeLineSeries,
  makeOption,
  makeReferenceSeries,
  makeStackedSeries,
} from '@/app/ui/charts/echarts';
import { renderToString } from '@/app/ui/charts/echarts/renderToString';
import { getAnnee, getYear } from '@/app/ui/charts/echarts/utils';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { GridComponentOption } from 'echarts';
import { uniq } from 'es-toolkit';
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

const TooltipContainerClassname =
  'max-w-80 break-words whitespace-normal text-xs [&_*]:text-xs [&_*]:mb-0';

/** Data issues de l'api pour générer les données formatées pour echarts */
type IndicateurChartData = {
  /** Unité affichée pour l'axe des abscisses et le tooltip */
  unite?: string;
  /** Valeurs de l'indicateur  */
  valeurs: {
    objectifs: PreparedData;
    resultats: PreparedData;
    segments?:
      | {
          definition: IndicateurDefinition;
          source: PreparedData['sources'][number];
        }[]
      | null;
  };
};

// prépare les données pour l'affichage des lignes objectifs/résultats pour
// chaque source disponible
const prepareDataset = (
  data: IndicateurChartData,
  type: SourceType,
  getColorBySourceId: GetColorBySourceId
) =>
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
        name: getSourceLabel(source, libelle, type),
        source: valeurs,
        dimensions: ['anneeISO', 'valeur'],
        metadonnee,
        nomSource: libelle,
      };
    }) ?? [];

// prépare les données pour l'affichage des surfaces superposées pour
// les segments (sous-indicateurs d'un indicateur composé avec agrégation)
const prepareSegmentsDataset = (chartInfo: IndicateurChartInfo) => {
  const { data, segmentItemParId } = chartInfo;
  const { segments } = data.valeurs;

  if (!segments?.length) return [];

  // extrait les années uniques pour les segments
  const annees = uniq(
    segments.flatMap(({ source }) => source.valeurs.map(({ annee }) => annee))
  ).sort();

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
      source: annees.map((annee) => {
        const valeur = source.valeurs.find((v) => v.annee === annee);
        // remplace les années manquantes par 0 pour améliorer l'affichage des surfaces empilées
        return valeur ?? 0;
      }),
      dimensions: ['anneeISO', 'valeur'],
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
  anneeISO: string,
  libelle: string | null
) => ({
  color: LAYERS[id].color,
  id,
  calculAuto: false,
  name: `Valeur ${id === 'seuil' ? 'limite' : id} : ${valeur} ${unite}`,
  source: [{ anneeISO, valeur }],
  dimensions: ['anneeISO', 'valeur'],
  metadonnee: null,
  nomSource: libelle,
});

const getObjectifReferenceName = (
  valeurs: { valeur: number; dateValeur: string }[],
  unite: string,
  libelle: string | null
) => {
  if (valeurs.length === 1) {
    const { dateValeur, valeur } = valeurs[0];
    const annee = getYear(dateValeur);
    return `Objectif ${annee} : ${valeur} ${unite}`;
  }

  return libelle ?? 'Objectifs';
};

const makeReferenceObjectifsDataset = (
  valeurs: { valeur: number; dateValeur: string }[],
  unite: string,
  libelle: string | null
) => ({
  color: LAYERS.cible.color,
  id: 'cible-objectifs',
  name: getObjectifReferenceName(valeurs, unite, libelle),
  source: valeurs.map(({ valeur, dateValeur }) => ({
    ...getAnnee(dateValeur),
    valeur,
  })),
  dimensions: ['anneeISO', 'valeur'],
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
  const { anneeISO } = getAnnee();
  const dataset = [];

  // les valeurs cible/seuil n'ont pas d'année
  // alors on ajoute un point uniquement pour l'année courante
  if (cible !== null) {
    dataset.push(
      makeReferenceDataset('cible', cible, data.unite ?? '', anneeISO, libelle)
    );
  }
  if (seuil !== null) {
    dataset.push(
      makeReferenceDataset('seuil', seuil, data.unite ?? '', anneeISO, libelle)
    );
  }
  if (objectifs?.length) {
    dataset.push(
      makeReferenceObjectifsDataset(objectifs, data.unite ?? '', libelle)
    );
  }
  return dataset;
};

/** Props du graphique générique Indicateur */
export type IndicateurChartProps = {
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

const IndicateurChart = ({
  chartInfo,
  title,
  isLoading,
  variant = 'detail',
  className,
}: IndicateurChartProps) => {
  const { data } = chartInfo;

  const getColorBySourceId = useGetColorBySourceId();

  const donneesResultatObjectif = [
    ...prepareDataset(data, 'resultat', getColorBySourceId),
    ...prepareDataset(data, 'objectif', getColorBySourceId),
  ];

  const donneesSegments = prepareSegmentsDataset(chartInfo);
  const references = prepareReferenceDataset(chartInfo);

  const dataset = [
    ...donneesResultatObjectif,
    ...donneesSegments,
    ...references,
  ];

  if (!dataset.length) return null;

  const style = { height: variantToHeight[variant] };

  const grid = variantToGrid[variant];

  const series = [
    ...makeLineSeries(donneesResultatObjectif),
    ...makeStackedSeries(donneesSegments),
    ...makeReferenceSeries(references, variant !== 'thumbnail'),
  ];

  const option = makeOption({
    option: {
      dataset,
      series,
      grid,
      title: variant === 'detail' ? { left: 28 } : {},
      legend: {
        show: variant !== 'thumbnail',
        textStyle: variant === 'thumbnail' ? { fontSize: '0.7rem' } : {},
        // pour la variante vignette on affiche la légende seulement pour résultats/objectifs
        data:
          variant === 'thumbnail'
            ? makeLegendData(donneesResultatObjectif)
            : makeLegendData(series),
        // infobulle avec les métadonnées associées à la source open data
        tooltip: {
          show: true,
          formatter: (params) => {
            const item = dataset?.find((s) => s.name === params.name);
            if (
              item &&
              item.nomSource &&
              DATASET_REFERENCE.includes(item.id as string)
            ) {
              return `<div class="${TooltipContainerClassname}">${item.nomSource}</div>`;
            }

            return item?.metadonnee
              ? renderToString(
                  <DataSourceTooltipContent
                    calculAuto={item.calculAuto}
                    metadonnee={item.metadonnee}
                    nomSource={item.nomSource}
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
    disableToolbox: variant !== 'modal',
    hideMinMaxLabel:
      dataset[0]?.source.length <= 1 && dataset[1]?.source.length <= 1,
  });

  return (
    <div className={className} style={style}>
      {isLoading ? (
        <div className="h-full w-full rounded-lg flex justify-center items-center bg-primary-0">
          <SpinnerLoader className="w-8 h-8 fill-primary-5" />
        </div>
      ) : (
        <ReactECharts option={option} style={style} />
      )}
    </div>
  );
};

export default IndicateurChart;
