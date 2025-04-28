/** Transforme les données pour l'affichage dans le tableau */

import { RouterOutput } from '@/api/utils/trpc/client';
import { getAnnee } from '@/app/ui/charts/echarts';
import { uniq } from 'es-toolkit';
import { SourceType } from '../types';

type IndicateurData =
  RouterOutput['indicateurs']['valeurs']['list']['indicateurs'][number];

/** Prépare les données pour l'affichage dans le tableau */
export const prepareData = (
  data: IndicateurData | undefined,
  type: SourceType,
  avecDonneesCollectiviteVides: boolean
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
    calculAuto: sourceData.valeurs.some((v) => v.calculAuto) || false,
    valeurs: sourceData.valeurs.map((v) => {
      const { annee, anneeISO } = getAnnee(v.dateValeur);
      return {
        id: v.id,
        calculAuto: Boolean(v.calculAuto),
        annee,
        anneeISO,
        valeur: v[type],
        commentaire: v[`${type}Commentaire`],
      };
    }),
    metadonnees: sourceData.metadonnees || [],
    type,
  }));

  // trie les sources par ordre alphabétique
  // et place les données de la collectivité en premier
  const sources = sourcesEtValeursModifiees.sort((a, b) => {
    if (a.source === 'collectivite') return -1;
    if (b.source === 'collectivite') return 1;
    return a.source.localeCompare(b.source);
  });

  // ajoute une source vide pour les données de la collectivité si elles n'existent pas
  // afin que la ligne soit toujours affichée dans le tableau
  // (sauf si le flag `avecDonneesCollectiviteVides` n'est pas activé)
  let donneesCollectivite = sources?.find((s) => s.source === 'collectivite');
  if (!donneesCollectivite && avecDonneesCollectiviteVides) {
    donneesCollectivite = {
      source: 'collectivite',
      calculAuto: false,
      valeurs: [],
      metadonnees: [],
      ordreAffichage: -1,
      libelle: '',
      type,
    };
    sources.unshift(donneesCollectivite);
  }

  // dernière année pour laquelle le résultat peut être en mode privé
  let anneeModePrive: number | undefined;
  if (type === 'resultat') {
    anneeModePrive = donneesCollectivite?.valeurs
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
    indicateurId: data?.definition.id,
    anneeModePrive,
    sources,
    donneesCollectivite,
    valeursExistantes,
  };
};

export function getAnneesDistinctes({ sources }: PreparedData) {
  // fusionne les tableaux de valeurs de toutes les sources
  const toutesValeurs = sources.flatMap((sourceData) => sourceData.valeurs);

  // extrait les années (pour créer les colonnes)
  return uniq(toutesValeurs.map((v) => v.annee)).sort();
}

export type PreparedData = ReturnType<typeof prepareData>;
export type PreparedValue = PreparedData['valeursExistantes'][number];
