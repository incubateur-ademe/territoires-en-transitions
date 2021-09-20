import {Line} from 'react-chartjs-2';
import {useAnyIndicateurValueForAllYears} from 'core-logic/hooks/indicateurs_values';
import {useEpciId} from 'core-logic/hooks';
import {HybridStore} from 'core-logic/api/hybridStore';
import {AnyIndicateurValueStorable} from 'storables';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import type {ChartData, ChartDataset} from 'chart.js';

const range = (start: number, end: number) => {
  const length = end + 1 - start;
  return Array.from({length}, (_, i) => start + i);
};

const getDataset = (
  yearRange: number[],
  indicateurValues: AnyIndicateurValueStorable[],
  label: string,
  color: string,
  kwargs?: Partial<ChartDataset>
): ChartDataset => {
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
  indicateurId: string;
  unit: string;
  title: string;
  resultatStore: HybridStore<AnyIndicateurValueStorable>;
  objectifStore: HybridStore<AnyIndicateurValueStorable>;
}) => {
  const epciId = useEpciId()!;
  const resultatValueStorables = useAnyIndicateurValueForAllYears(
    props.indicateurId,
    epciId,
    props.resultatStore
  );
  const objectifValueStorables = useAnyIndicateurValueForAllYears(
    props.indicateurId,
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

  const data: ChartData = {
    labels,
    datasets: [
      getDataset(yearRange, resultatValueStorables, 'Résultats', '#000091'),
      getDataset(yearRange, objectifValueStorables, 'Objectifs', '#6a6a6a', {
        borderDash: [2, 3],
      }),
    ],
  };
  return (
    <div className="w-2/3 h-60">
      <div className="sm text-center font-bold">{props.title}</div>
      <Line
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
  );
};

export const AnyIndicateurLineChartExpandable = (props: {
  indicateur: IndicateurPersonnaliseStorable | IndicateurReferentiel;
  resultatStore: HybridStore<AnyIndicateurValueStorable>;
  objectifStore: HybridStore<AnyIndicateurValueStorable>;
}) => (
  <div className="CrossExpandPanel">
    <details>
      <summary className="title">Graphique</summary>
      <AnyIndicateurLineChart
        indicateurId={props.indicateur.id}
        unit={props.indicateur.unite}
        title={props.indicateur.nom}
        resultatStore={props.resultatStore}
        objectifStore={props.objectifStore}
      />
    </details>
  </div>
);
