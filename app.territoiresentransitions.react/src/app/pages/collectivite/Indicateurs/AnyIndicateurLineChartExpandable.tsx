import {Line} from 'react-chartjs-2';
import {useAnyIndicateurValueForAllYears} from 'core-logic/hooks/indicateurs_values';
import {useEpciId} from 'core-logic/hooks';
import {HybridStore} from 'core-logic/api/hybridStore';
import {AnyIndicateurValueStorable} from 'storables';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';

const range = (start: number, end: number) => {
  const length = end + 1 - start;
  return Array.from({length}, (_, i) => start + i);
};

const AnyIndicateurLineChart = (props: {
  indicateurId: string;
  unit: string;
  title: string;
  resultatStore: HybridStore<AnyIndicateurValueStorable>;
}) => {
  const epciId = useEpciId()!;
  const resultatValueStorables = useAnyIndicateurValueForAllYears(
    props.indicateurId,
    epciId,
    props.resultatStore
  );

  const yearsWithValue = resultatValueStorables.map(storable => storable.year);
  const yearRange = range(
    yearsWithValue[0],
    yearsWithValue[yearsWithValue.length - 1]
  );
  const values = yearRange.map(year => {
    const storableForYear = resultatValueStorables.find(
      storable => storable.year === year
    );
    return storableForYear ? parseFloat(storableForYear.value) : null;
  }); // TODO : not needed if field type is float

  const data = {
    labels: yearRange,
    datasets: [
      {
        label: 'résultats',
        data: values,
        fill: false,
        backgroundColor: '#000091',
        borderColor: '#000091',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 3,
        tension: 0.2,
        spanGaps: true,
      },
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
          plugins: {legend: {display: false}},
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
}) => (
  <div className="CrossExpandPanel">
    <details>
      <summary className="title">Graphique</summary>
      <AnyIndicateurLineChart
        indicateurId={props.indicateur.id}
        unit={props.indicateur.unite}
        title={props.indicateur.nom}
        resultatStore={props.resultatStore}
      />
    </details>
  </div>
);
