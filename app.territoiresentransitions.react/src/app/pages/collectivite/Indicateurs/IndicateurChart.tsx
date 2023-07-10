import classNames from 'classnames';
import {Serie, SliceTooltipProps} from '@nivo/line';
import {ChartCardContent} from 'ui/charts/ChartCard';
import LineChart, {
  LineChartProps,
  generateStyledLines,
  getLabelsBySerieId,
} from 'ui/charts/LineChart';
import {defaultColors, theme} from 'ui/charts/chartsTheme';
import {TIndicateurDefinition} from './types';
import PictoPie from 'ui/pictogrammes/PictoPie';
import {TIndicateurValeur, useIndicateurValeurs} from './useIndicateurValeurs';

export type TIndicateurChartProps = {
  definition: TIndicateurDefinition;
  /** affichage par défaut (dans la grille) ou zoomé (téléchargeable) */
  variant?: 'default' | 'zoomed';
  className?: string;
};

export type TIndicateurChartBaseProps = TIndicateurChartProps & {
  valeurs: TIndicateurValeur[];
};

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

// conteneur du graphe
const Card = ({children, className}: CardProps): JSX.Element => {
  return (
    <div
      className={classNames('h-80 bg-white rounded-lg p-4 border', className)}
    >
      {children}
    </div>
  );
};

// indique qu'il n'y a pas de suffisamment de données pour afficher le graphe
export const NoData = ({
  definition,
  variant,
  className,
}: TIndicateurChartProps) => (
  <Card
    className={classNames(
      'flex flex-col items-center justify-between px-10 py-6',
      {'rounded-none': variant === 'zoomed'},
      className
    )}
  >
    <span className="font-bold text-[#161616]">
      {getChartTitle(definition)}
    </span>
    <PictoPie />
    <span className="text-grey425 text-sm">
      Aucune valeur renseignée pour l’instant
    </span>
  </Card>
);

// fourni le titre du graphe à partir d'une définition (perso ou prédéfinie)
const getChartTitle = (definition: TIndicateurDefinition) => {
  const {isPerso, nom, titre} = definition;
  return isPerso ? titre : nom;
};

/**
 * Affiche un graphique de type "lignes" combinant les valeurs objectif/résultat
 */
export const IndicateurChartBase = (props: TIndicateurChartBaseProps) => {
  const {valeurs, definition, variant, className} = props;

  const data = prepareData(valeurs, defaultColors[0]);
  const labelBySerieId = getLabelsBySerieId(data);
  const title = getChartTitle(definition);
  const isZoomed = variant === 'zoomed';

  const chart = (
    <LineChart
      {...({
        data,
        // utilise les couleurs des séries plutôt que les couleurs par défaut
        colors: {datum: 'color'},
        // surcharge les couches du graphe pour utiliser un style de lignes personnalisé
        layers: [
          'grid',
          'markers',
          'areas',
          generateStyledLines(lineStyleBySerieId),
          'slices',
          'points',
          'axes',
          'legends',
        ],
        axisBottom: {
          legendPosition: 'end',
          tickSize: 5,
          tickPadding: 12,
          tickRotation: 0,
          tickValues: isZoomed ? 10 : 5,
          format: '%Y',
        },
        // légende au bas du graphique
        legends: [
          {
            anchor: 'bottom',
            direction: 'row',
            translateY: isZoomed ? 65 : 55,
            itemWidth: 120,
            itemHeight: 20,
            data: data as any,
            // avec un symbole personnalisé pour afficher une ligne pleine ou pointillée
            symbolShape: ({fill, id}) => (
              <PathLine
                serieId={id}
                stroke={fill}
                transform="translate(0, 9)"
              />
            ),
          },
        ],
        // infobulle par année
        sliceTooltip: props => (
          <SliceTooltip
            {...props}
            labels={labelBySerieId}
            indicateur={definition}
          />
        ),
        axisLeftLegend: definition.unite,
      } as LineChartProps)}
    />
  );

  return (
    <Card
      className={classNames({'rounded-none h-[540px]': isZoomed}, className)}
    >
      <ChartCardContent
        //        className="border-0 h-72 pt-2"
        chart={chart}
        chartInfo={{
          title,
          chartClassname: isZoomed ? 'h-[440px]' : 'h-48',
          downloadedFileName: isZoomed
            ? definition.nom || definition.titre
            : undefined,
        }}
      />
    </Card>
  );
};

// Affiche une ligne (pleine ou hachée) dans la légende et l'infobulle
const LEGEND_LINE_WIDTH = 12;
const PathLine = ({
  serieId,
  stroke,
  transform,
}: {
  serieId: string | number;
  stroke: string;
  transform?: string;
}) => (
  <path
    d={`M0 1H${LEGEND_LINE_WIDTH}`}
    fill="none"
    stroke={stroke}
    style={lineStyleBySerieId[serieId]}
    transform={transform}
  />
);

// styles de ligne en fonction de l'id de la série
const lineStyleBySerieId: Record<string, {}> = {
  objectifs: {
    strokeDasharray: '2, 2',
    strokeWidth: 2,
  },
  resultats: {
    strokeWidth: 3,
  },
};

// Affiche l'infobulle au-dessus des portions du graphe
const SliceTooltip = (
  props: SliceTooltipProps & {
    labels: Record<string, string>;
    indicateur: TIndicateurDefinition;
  }
) => {
  const {slice, labels, indicateur} = props;
  // l'année pour la portion est la valeur formatée du 1er point sur l'axe x
  const annee = new Date(slice.points[0]?.data.xFormatted).getFullYear();

  return (
    <div style={theme.tooltip?.container}>
      <div className="border-b-[1px] fr-pb-2v fr-mb-2v">Année : {annee}</div>
      {slice.points.map(point => (
        <div key={point.id}>
          <svg
            width={LEGEND_LINE_WIDTH}
            height={3}
            className={classNames('inline fr-mr-1w')}
          >
            <PathLine serieId={point.serieId} stroke={point.serieColor} />
          </svg>{' '}
          {labels[point.serieId]}
          {' : '}
          <b>{point.data.yFormatted}</b> {indicateur.unite}
        </div>
      ))}
    </div>
  );
};

// transforme les données chargées en `Serie[]` pour affichage dans le graphe
const prepareData = (valeurs: TIndicateurValeur[], color: string): Serie[] => {
  // sépare les valeurs "objectif" des autres
  const objectifs: TIndicateurValeur[] = [];
  const autres: TIndicateurValeur[] = [];
  valeurs?.forEach(v => (v.type === 'objectif' ? objectifs : autres).push(v));

  // sépare les valeurs restantes par année
  const valeursParAnnee: Record<string, TIndicateurValeur[]> = {};
  autres?.forEach(v => {
    valeursParAnnee[v.annee] = [...(valeursParAnnee[v.annee] || []), v];
  });

  // puis pour chaque année sélectionne la valeur "résultat" ou la valeur
  // "import" si il y a plusieurs valeurs
  const resultats: TIndicateurValeur[] = [];
  Object.values(valeursParAnnee)?.forEach(values => {
    if (!values.length) return;

    const resultatOuImport =
      values.find(v => v.type === 'resultat') ||
      values.find(v => v.type === 'import');
    if (resultatOuImport) {
      resultats.push(resultatOuImport);
    }
  });

  const toDatum = ({annee: x, valeur: y}: TIndicateurValeur) => ({x, y});

  return [
    {
      id: 'objectifs',
      label: 'Objectif',
      color,
      data: objectifs.map(toDatum),
    },
    {
      id: 'resultats',
      label: 'Résultat',
      color,
      data: resultats.map(toDatum),
    },
  ];
};

/** Charge les données et affiche le graphique */
const IndicateurChart = (props: TIndicateurChartProps) => {
  const {definition} = props;

  const {data: valeurs, isLoading} = useIndicateurValeurs(definition);

  const noDataAvailable = !isLoading && !valeurs?.length;

  return noDataAvailable ? (
    <NoData {...props} />
  ) : (
    <IndicateurChartBase {...props} valeurs={valeurs!} />
  );
};

export default IndicateurChart;
