import {Line} from 'react-chartjs-2';
import {useAnyIndicateurValueForAllYears} from 'core-logic/hooks/indicateurs_values';
import {useEpciId} from 'core-logic/hooks';
import {HybridStore} from 'core-logic/api/hybridStore';
import {AnyIndicateurValueStorable} from 'storables';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import type {ChartData, ChartDataset} from 'chart.js';
import {Spacer} from 'ui/shared';

const range = (start: number, end: number) => {
  const length = end + 1 - start;
  return Array.from({length}, (_, i) => start + i);
};

const getDataset = (
  yearRange: number[],
  indicateurValues: AnyIndicateurValueStorable[],
  label: string,
  color: string,
  kwargs?: Partial<ChartDataset<'line'>>
): ChartDataset<'line'> => {
  const data = yearRange.map(year => {
    const storableForYear = indicateurValues.find(
      storable => storable.year === year
    );
    return storableForYear ? storableForYear.value : NaN;
  });
  const datastet = {
    label,
    data,
    fill: false,
    backgroundColor: color,
    borderColor: color,
    strokeColor: color,
    borderWidth: 2,
    pointRadius: 2,
    pointHoverRadius: 3,
    tension: 0.2,
    spanGaps: true,
    ...kwargs,
  };

  return datastet;
};

const AnyIndicateurLineChart = (props: {
  indicateurUid: string;
  unit: string;
  title: string;
  resultatStore: HybridStore<AnyIndicateurValueStorable>;
  objectifStore: HybridStore<AnyIndicateurValueStorable>;
}) => {
  const epciId = useEpciId()!;
  const resultatValueStorables = useAnyIndicateurValueForAllYears(
    props.indicateurUid,
    epciId,
    props.resultatStore
  );
  const objectifValueStorables = useAnyIndicateurValueForAllYears(
    props.indicateurUid,
    epciId,
    props.objectifStore
  );

  if (!resultatValueStorables.length && !objectifValueStorables.length)
    return <>Aucune donnée n'est renseignée.</>;

  const firstYear = Math.min(
    resultatValueStorables.length ? resultatValueStorables[0].year : Infinity,
    objectifValueStorables.length ? objectifValueStorables[0].year : Infinity
  );
  const lastYear = Math.max(
    resultatValueStorables.length
      ? resultatValueStorables[resultatValueStorables.length - 1].year
      : -1,
    objectifValueStorables.length
      ? objectifValueStorables[objectifValueStorables.length - 1].year
      : -1
  );

  const yearRange = range(firstYear, lastYear);
  const labels = yearRange.map(year => year.toString());

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      getDataset(yearRange, resultatValueStorables, 'Résultats', '#000091'),
      getDataset(yearRange, objectifValueStorables, 'Objectifs', '#6a6a6a', {
        borderDash: [2, 3],
      }),
    ],
  };
  const canvasId = `chart-${props.indicateurUid}`;
  return (
    <div>
      <div className="w-2/3 h-72 pb-7">
        <div className="sm text-center font-bold ">{props.title}</div>
        <Line
          id={canvasId}
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                display: true,
                labels: {
                  boxHeight: 0,
                },
              },
            },
            scales: {
              y: {
                title: {
                  display: true,
                  text: props.unit,
                },
              },
            },
          }}
        />
      </div>
      <Spacer />
      <a
        className="fr-btn fr-btn--secondary ml-7 mt-7"
        id="download"
        download={`${props.title}.png`}
        href=""
        onClick={() => {
          const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
          if (canvas) {
            (document.getElementById('download') as HTMLLinkElement).href =
              canvas.toDataURL();
          }
        }}
      >
        Télécharger le graphique en .png
      </a>
    </div>
  );
};

export const AnyIndicateurLineChartExpandable = (props: {
  indicateur: IndicateurPersonnaliseStorable | IndicateurReferentiel;
  indicateurId: string; // TODO : this should be infered by props.indicateur but there's a mikmak with uid (for indic perso) and id (for indic ref) ...
  resultatStore: HybridStore<AnyIndicateurValueStorable>;
  objectifStore: HybridStore<AnyIndicateurValueStorable>;
}) => (
  <div className="CrossExpandPanel">
    <details open>
      <summary className="title">Graphique</summary>
      <AnyIndicateurLineChart
        indicateurUid={props.indicateur.uid}
        unit={props.indicateur.unite}
        title={props.indicateur.nom}
        resultatStore={props.resultatStore}
        objectifStore={props.objectifStore}
      />
    </details>
  </div>
);
