import {Line} from 'react-chartjs-2';
import {useCollectiviteId} from 'core-logic/hooks';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import type {ChartData, ChartDataset} from 'chart.js';
import {Spacer} from 'ui/shared';
import {
  AnyIndicateurRepository,
  indicateurObjectifRepository,
  indicateurResultatRepository,
} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {AnyIndicateurValueRead} from 'generated/dataLayer/any_indicateur_value_write';
import {useIndicateurValuesForAllYears} from 'core-logic/hooks/indicateur_values';

const range = (start: number, end: number) => {
  const length = end + 1 - start;
  return Array.from({length}, (_, i) => start + i);
};

const getDataset = (
  yearRange: number[],
  indicateurValues: AnyIndicateurValueRead[],
  label: string,
  color: string,
  kwargs?: Partial<ChartDataset>
): ChartDataset => {
  const data = yearRange.map(year => {
    const storableForYear = indicateurValues.find(
      values => values.annee === year
    );
    return storableForYear ? storableForYear.valeur : NaN;
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
  resultatRepo: AnyIndicateurRepository;
  objectifRepo: AnyIndicateurRepository;
}) => {
  const collectiviteId = useCollectiviteId()!;

  const resultatValues = useIndicateurValuesForAllYears({
    collectiviteId,
    indicateurId: props.indicateurId,
    repo: indicateurResultatRepository,
  });
  const objectifValues = useIndicateurValuesForAllYears({
    collectiviteId,
    indicateurId: props.indicateurId,
    repo: indicateurObjectifRepository,
  });

  if (!resultatValues.length && !objectifValues.length)
    return <>Aucune donnée n'est renseignée.</>;

  const firstYear = Math.min(
    resultatValues.length ? resultatValues[0].annee : Infinity,
    objectifValues.length ? objectifValues[0].annee : Infinity
  );
  const lastYear = Math.max(
    resultatValues.length
      ? resultatValues[resultatValues.length - 1].annee
      : -1,
    objectifValues.length ? objectifValues[objectifValues.length - 1].annee : -1
  );

  const yearRange = range(firstYear, lastYear);
  const labels = yearRange.map(year => year.toString());

  const data: ChartData = {
    labels,
    datasets: [
      getDataset(yearRange, resultatValues, 'Résultats', '#000091'),
      getDataset(yearRange, objectifValues, 'Objectifs', '#6a6a6a', {
        borderDash: [2, 3],
      }),
    ],
  };
  const canvasId = `chart-${props.indicateurId}`;
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
  resultatRepo: AnyIndicateurRepository;
  objectifRepo: AnyIndicateurRepository;
}) => (
  <div className="CrossExpandPanel">
    <details open>
      <summary className="title">Graphique</summary>
      <AnyIndicateurLineChart
        indicateurId={props.indicateur.uid}
        unit={props.indicateur.unite}
        title={props.indicateur.nom}
        resultatRepo={props.resultatRepo}
        objectifRepo={props.objectifRepo}
      />
    </details>
  </div>
);
