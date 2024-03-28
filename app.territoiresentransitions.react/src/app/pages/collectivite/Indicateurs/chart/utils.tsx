import {Datum} from '@nivo/line';
import {dedup} from 'utils/dedup';
import {TIndicateurValeur} from '../useIndicateurValeurs';
import {LineData} from 'ui/charts/Line/LineChart';
import {defaultColors} from 'ui/charts/chartsTheme';

/** Data de base sans valeur des graphiques Indicateur */
export const indicateurBaseData: Record<string, LineData> = {
  objectif: {
    id: 'objectif',
    label: 'Objectif',
    data: [],
    color: defaultColors[0],
    style: {
      strokeDasharray: '2, 2',
      strokeWidth: 2,
    },
    symbole: color => (
      <div className="flex gap-1">
        <div
          className="w-1.5 h-1 rounded-full"
          style={{backgroundColor: color}}
        />
        <div
          className="w-1.5 h-1 rounded-full"
          style={{backgroundColor: color}}
        />
      </div>
    ),
  },
  resultat: {
    id: 'resultat',
    label: 'Résultat',
    data: [],
    color: defaultColors[0],
    style: {
      strokeWidth: 3,
    },
    symbole: color => (
      <div className="h-1 w-4 rounded-full" style={{backgroundColor: color}} />
    ),
  },
};

/* Transforme les valeurs d'un indicateur en séries "Objectifs" et "Résultats"
pour affichage dans le graphe */
export const prepareData = (valeurs: TIndicateurValeur[]): LineData[] => {
  // sépare les valeurs "objectif" des valeurs "résultat" (ou "import")
  const objectifs: TIndicateurValeur[] = [];
  const resultats: TIndicateurValeur[] = [];
  valeurs?.forEach(v =>
    (v.type === 'objectif' ? objectifs : resultats).push(v)
  );

  return [
    {
      ...indicateurBaseData.objectif,
      data: objectifs.map(toDatum),
    },
    {
      ...indicateurBaseData.resultat,
      data: resultats.map(toDatum),
    },
  ];
};

/** Converti une valeur d'indicateur en point d'une série */
const toDatum = ({annee: x, valeur: y}: TIndicateurValeur): Datum => ({
  x,
  y,
});

// détermine la fréquence des graduations pour l'axe des abscisses
export const getXTickValues = (
  valeurs: TIndicateurValeur[],
  // nombre de valeurs maximum
  maxTickValues?: number
) => {
  const maxTicks = maxTickValues || 10;
  // sélectionne les valeurs distinctes
  const distinctYears = valeurs?.length
    ? dedup(valeurs.map(({annee}) => annee))
    : [];

  // puis l'écart entre le max et le min qui donne le nombre de graduations maximum
  const ticksCount = Math.max(...distinctYears) - Math.min(...distinctYears);

  if (ticksCount === 0) return 1;

  // une graduation par année pour éviter les doublons, si en dessous du seuil,
  // sinon on utilise la valeur seuil pour éviter la superposition de valeurs
  return ticksCount < maxTicks ? ticksCount : maxTicks;
};
