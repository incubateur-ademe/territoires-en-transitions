import {SliceTooltipProps} from '@nivo/line';
import {indicateurBaseData} from 'app/pages/collectivite/Indicateurs/chart/utils';

import {theme} from 'ui/charts/chartsTheme';

// Affiche l'infobulle au-dessus des portions du graphe
export const SliceTooltip = (
  props: SliceTooltipProps & {
    unite: string;
  }
) => {
  const {slice, unite} = props;
  // l'année pour la portion est la valeur formatée du 1er point sur l'axe x
  const annee = new Date(slice.points[0]?.data.xFormatted).getFullYear();

  return (
    <div style={theme.tooltip?.container}>
      <div className="pb-1.5 mb-1.5 border-b-[1px]">Année : {annee}</div>
      <div className="flex flex-col gap-2">
        {slice.points.map(point => {
          const baseData = indicateurBaseData[point.serieId];
          return (
            <div key={point.id} className="flex flex-wrap gap-1">
              <div className="flex gap-1">
                {baseData.symbole && baseData.color && (
                  <div className="scale-75 mr-1 mt-2">
                    {baseData.symbole(baseData.color)}
                  </div>
                )}
                {baseData.label}
                {' : '}
              </div>
              <b>{point.data.yFormatted}</b> {unite}
            </div>
          );
        })}
      </div>
    </div>
  );
};
