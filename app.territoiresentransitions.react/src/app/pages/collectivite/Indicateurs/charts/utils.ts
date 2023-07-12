import {Datum, Serie} from '@nivo/line';
import {TIndicateurValeur} from '../useIndicateurValeurs';
import {TIndicateurDefinition} from '../types';

// libellé par défaut pour les séries objectifs/résultats
const SERIE_LABELS = {
  objectifs: 'Objectif',
  resultats: 'Résultat',
};

/* Transforme les valeurs d'un indicateur en séries "Objectifs" et "Résultats"
pour affichage dans le graphe */
export const prepareData = (
  valeurs: TIndicateurValeur[],
  color: string,
  serieOptions?: {
    labels: typeof SERIE_LABELS;
    idSuffix: string;
  }
): Serie[] => {
  // sépare les valeurs "objectif" des valeurs "résultat" (ou "import")
  const objectifs: TIndicateurValeur[] = [];
  const resultats: TIndicateurValeur[] = [];
  valeurs?.forEach(v =>
    (v.type === 'objectif' ? objectifs : resultats).push(v)
  );

  // détermine les libellés et le préfixe (optionnel) d'id des séries
  const labels = serieOptions?.labels || SERIE_LABELS;
  const suffix = serieOptions?.idSuffix || '';

  return [
    {
      id: `objectifs-${suffix}`,
      label: labels.objectifs,
      color,
      data: objectifs.map(toDatum),
    },
    {
      id: `resultats-${suffix}`,
      label: labels.resultats,
      color,
      data: resultats.map(toDatum),
    },
  ];
};

/** Converti une valeur d'indicateur en point d'une série */
const toDatum = ({annee: x, valeur: y}: TIndicateurValeur): Datum => ({
  x,
  y,
});

// fourni le titre du graphe à partir d'une définition (perso ou prédéfinie)
export const getChartTitle = (definition: TIndicateurDefinition) => {
  const {isPerso, nom, titre} = definition;
  return isPerso ? titre : nom;
};

// détermine la fréquence des graduations pour l'axe des abscisses
export const getXTickValues = (
  valeurs: TIndicateurValeur[],
  isZoomed?: boolean
) => {
  // nombre de valeurs maximum suivant que le graphe est en grand ou non
  const maxTickValues = isZoomed ? 10 : 5;

  // sélectionne les valeurs distinctes
  const distinctYears = valeurs?.length
    ? [...new Set(valeurs.map(({annee}) => annee))]
    : [];

  // une graduation par année pour éviter les doublons, si en dessous du seuil,
  // sinon on utilise la valeur seuil pour éviter la superposition de valeurs
  return distinctYears.length < maxTickValues ? 'every year' : maxTickValues;
};
