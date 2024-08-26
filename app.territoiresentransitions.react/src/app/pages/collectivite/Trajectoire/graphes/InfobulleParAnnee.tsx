import {SliceTooltip} from '@nivo/line';
import {AreaSymbol, SolidLineSymbol} from 'ui/charts/ChartLegend';
import {LineData} from 'ui/charts/Line/LineChart';

/** Génère un composant infobulle pour les graphes de trajectoire */
export const genInfobulleParAnnee = ({
  objectifsEtResultats,
  secteurs,
}: {
  objectifsEtResultats: LineData[];
  secteurs: LineData[];
}) => {
  const InfobulleParAnnee: SliceTooltip = ({slice}) => {
    const annee = slice.points[0].data.x;
    return (
      <div className="flex flex-col gap-1 bg-white p-4 font-normal text-primary-8 text-sm shadow-sm">
        {/** Année */}
        <span>
          En <strong>{(slice.points[0].data.x as Date).getFullYear()}</strong>
        </span>
        {
          /** Légende des aires empilées par secteurs */
          slice.points
            .sort((a, b) => (b.data.y as number) - (a.data.y as number))
            .map(point => {
              const secteur = secteurs.find(s => s.id === point.serieId);
              return (
                secteur && (
                  <div className="flex items-center gap-3" key={point.id}>
                    {AreaSymbol(point.serieColor!)}
                    {secteur.label}
                    <strong>{point.data.yFormatted}</strong>
                  </div>
                )
              );
            })
        }
        {!!objectifsEtResultats?.length && (
          <div className="mt-2">
            {objectifsEtResultats.map(({id, data, color}) => {
              const value = data?.find(o => o.x === annee);
              return value ? (
                <div className="flex items-center gap-3" key={id}>
                  {SolidLineSymbol(color!)}
                  Objectif
                  <strong>{value.y?.toString()}</strong>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    );
  };
  return InfobulleParAnnee;
};
