import {CustomLayerProps} from '@nivo/line';
import {ChartLegendItem} from '../ChartLegend';
import {getDataColor} from '../utils';
import {LineData} from './LineChart';
import {TIndicateurValeur} from 'app/pages/collectivite/Indicateurs/useIndicateurValeurs';

/** Génère la liste des légendes pour le composant LineChart */
export const generateLineLegendItems = (
  data: LineData[]
): ChartLegendItem[] => {
  // Légende réduite à afficher
  return data.map((d, index) => ({
    name: d.label ?? d.id,
    color: getDataColor(d, data.length, index),
    symbole: d.symbole,
  }));
};

/** Calcule la margin left appliquée au graphique en fonction de la taille des valeurs */
export const getLeftLineChartMargin = (valeurs: TIndicateurValeur[]) => {
  const leftAxisValues = valeurs.map(v => v.valeur);
  const maxValue = Math.round(Math.max(...leftAxisValues));
  const valueLength = maxValue.toString().length;
  // 10px étant +- la largeur d'un caractère, on multiplie par 10 pour obtenir la largeur en px
  return valueLength <= 1 ? 16 : valueLength * 10;
};

/** Génère les lignes en appliquant le `style` donné dans la série */
export const StyledLineLayer = ({
  series,
  lineGenerator,
  xScale,
  yScale,
}: CustomLayerProps) => {
  return series.map(({id, data, color, style}) => (
    <path
      key={id}
      d={
        lineGenerator(
          data.map(d => ({
            x: (xScale as any)(d.data.x),
            y: (yScale as any)(d.data.y),
          }))
        ) || undefined
      }
      fill="none"
      stroke={color}
      style={style}
    />
  ));
};
