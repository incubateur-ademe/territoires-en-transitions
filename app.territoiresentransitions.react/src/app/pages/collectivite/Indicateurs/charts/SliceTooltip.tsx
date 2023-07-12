import classNames from 'classnames';
import {SliceTooltipProps} from '@nivo/line';
import {theme} from 'ui/charts/chartsTheme';
import {TIndicateurDefinition} from '../types';
import {CSSProperties} from 'react';

// Affiche une ligne (pleine ou hachée) dans la légende et l'infobulle
const LEGEND_LINE_WIDTH = 12;
export const PathLine = ({
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
    style={getLineStyleBySerieId(serieId)}
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

/**
 * Fourni le style d'une ligne en fonction du préfixe (objectif|résultat) d'un id de série.
 */
export const getLineStyleBySerieId = (
  serieId: string | number
): CSSProperties | undefined => {
  return lineStyleBySerieId[serieId.toString().split('-')?.[0]];
};

// Affiche l'infobulle au-dessus des portions du graphe
export const SliceTooltip = (
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
