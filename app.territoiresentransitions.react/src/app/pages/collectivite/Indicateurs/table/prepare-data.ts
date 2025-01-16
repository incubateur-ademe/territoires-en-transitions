/** Transforme les données pour l'affichage dans le tableau */

import { RouterOutput } from '@/api/utils/trpc/client';
import { uniq } from 'es-toolkit';
import { SourceType } from '../types';

type IndicateurData =
  RouterOutput['indicateurs']['valeurs']['list']['indicateurs'][number];

/** Prépare les données pour l'affichage dans le tableau */
export const prepareData = (
  data: IndicateurData | undefined,
  type: SourceType
) => {
  // conserve uniquement les sources ayant des valeurs pour le type de données voulu
  const { collectivite, ...autresSources } = data?.sources || {};
  const sourcesFiltrees = autresSources
    ? Object.values(autresSources).filter((sourceData) =>
        sourceData.valeurs.some((v) => typeof v[type] === 'number')
      )
    : [];
  if (collectivite) {
    sourcesFiltrees.unshift(collectivite);
  }

  // transforme les valeurs de chaque source
  const sourcesEtValeursModifiees = sourcesFiltrees.map((sourceData) => ({
    ...sourceData,
    valeurs: sourceData.valeurs.map((v) => ({
      id: v.id,
      annee: new Date(v.dateValeur).getFullYear(),
      valeur: v[type],
      commentaire: v[`${type}Commentaire`],
    })),
  }));

  // fusionne les tableaux de valeurs de toutes les sources
  const toutesValeurs = sourcesEtValeursModifiees.flatMap(
    (sourceData) => sourceData.valeurs
  );

  // extrait les années (pour créer les colonnes)
  const annees = uniq(toutesValeurs.map((v) => v.annee)).sort();

  // trie les sources par ordre alphabétique
  // et place les données de la collectivité en premier
  const sources = sourcesEtValeursModifiees.sort((a, b) => {
    if (a.source === 'collectivite') return -1;
    if (b.source === 'collectivite') return 1;
    return a.source.localeCompare(b.source);
  });

  // ajoute une source vide pour les données de la collectivité si elles n'existent pas
  // afin que la ligne soit toujours affichée dans le tableau
  let donneesCollectivite = sources?.find((s) => s.source === 'collectivite');
  if (!donneesCollectivite) {
    donneesCollectivite = {
      source: 'collectivite',
      valeurs: [],
      metadonnees: [],
    };
    sources.unshift(donneesCollectivite);
  }

  // dernière année pour laquelle le résultat peut être en mode privé
  let anneeModePrive: number | undefined;
  if (type === 'resultat') {
    anneeModePrive = donneesCollectivite.valeurs
      .filter((v) => v.valeur ?? false)
      .map((v) => v.annee)
      .sort()
      .pop();
  }

  // tableau des valeurs existantes (permet de vérifier s'il existe déjà une ligne pour une année)
  const valeursExistantes =
    data?.sources?.collectivite?.valeurs?.map((v) => ({
      ...v,
      annee: new Date(v.dateValeur).getFullYear(),
    })) || [];

  return {
    annees,
    anneeModePrive,
    sources,
    donneesCollectivite,
    valeursExistantes,
  };
};

export type PreparedData = ReturnType<typeof prepareData>;
export type PreparedValue = PreparedData['sources'][number]['valeurs'][number];
