/** Transforme les données pour l'affichage dans le tableau */

import { RouterOutput } from '@tet/api';
import {
  IndicateurPeriode,
  IndicateurPeriodes,
  IndicateurValeurGroupee,
  IndicateurValeursGroupeeParSource,
} from '@tet/domain/indicateurs';
import { SourceType } from '../types';

export type ListIndicateurValeursOutput =
  RouterOutput['indicateurs']['valeurs']['list'];

type IndicateurSources = ListIndicateurValeursOutput['indicateurs'][number];

type IndicateurSourceData = IndicateurSources['sources'][number];
export type IndicateurSourceValeur = IndicateurSourceData['valeurs'][number];

type PreparedSourceValue = {
  id: IndicateurSourceValeur['id'] | undefined;
  calculAuto: boolean;
  periode: IndicateurPeriode;
  periodeLabel: string;
  dateValeurISO: string;
  valeur: number | null | undefined;
  commentaire: string | null | undefined;
};

type PreparedSource = Omit<IndicateurValeursGroupeeParSource, 'valeurs'> & {
  calculAuto: boolean;
  valeurs: PreparedSourceValue[];
  type: SourceType;
};

export type PreparedValue = IndicateurValeurGroupee & {
  periode: IndicateurPeriode;
  periodeLabel: string;
};

export type PreparedData = {
  indicateurId: number | undefined;
  dernierePeriodeModePrive: IndicateurPeriode | undefined;
  periodes: IndicateurPeriode[];
  sources: PreparedSource[];
  donneesCollectivite: PreparedSource | undefined;
  valeursExistantes: PreparedValue[];
};

/** Prépare les données pour l'affichage dans le tableau */
export const prepareData = (
  data: IndicateurSources | undefined,
  type: SourceType,
  avecDonneesCollectiviteVides: boolean,
  additionalSources: readonly PreparedSource[] = []
): PreparedData => {
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
  const sourcesEtValeursModifiees: PreparedSource[] = sourcesFiltrees.map(
    (sourceData) => ({
      ...sourceData,
      calculAuto: sourceData.valeurs.some((v) => v.calculAuto) || false,
      valeurs: sourceData.valeurs.map((value) => {
        // Preserve the annual reading of historical dates within the year.
        const periode = IndicateurPeriodes.containing(
          value.periodicite,
          value.dateValeur
        );
        return {
          id: value.id,
          calculAuto: Boolean(value.calculAuto),
          periode,
          periodeLabel: IndicateurPeriodes.format(periode),
          dateValeurISO: `${IndicateurPeriodes.toDateValeur(
            periode
          )}T00:00:00.000Z`,
          valeur: value[type],
          commentaire: value[`${type}Commentaire`],
        };
      }),
      metadonnees: sourceData.metadonnees || [],
      type,
    })
  );

  // trie les sources par ordre alphabétique
  // et place les données de la collectivité en premier
  const sources = [...sourcesEtValeursModifiees, ...additionalSources].sort(
    (a, b) => {
      if (a.source === b.source) return 0;
      if (a.source === 'collectivite') return -1;
      if (b.source === 'collectivite') return 1;
      return a.source.localeCompare(b.source);
    }
  );

  // ajoute une source vide pour les données de la collectivité si elles n'existent pas
  // afin que la ligne soit toujours affichée dans le tableau
  // (sauf si le flag `avecDonneesCollectiviteVides` n'est pas activé)
  let donneesCollectivite = sources.find((s) => s.source === 'collectivite');
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

  // dernière période pour laquelle le résultat peut être en mode privé
  let dernierePeriodeModePrive: IndicateurPeriode | undefined;
  if (type === 'resultat') {
    dernierePeriodeModePrive = IndicateurPeriodes.merge(
      donneesCollectivite?.valeurs
        .filter((v) => v.valeur !== null && v.valeur !== undefined)
        .map((v) => v.periode) ?? []
    ).pop();
  }

  // tableau des valeurs existantes (permet de vérifier s'il existe déjà une ligne pour une année)
  const valeursExistantes: PreparedValue[] =
    data?.sources?.collectivite?.valeurs?.map((v) => {
      const periode = IndicateurPeriodes.containing(
        v.periodicite,
        v.dateValeur
      );
      return {
        ...v,
        periode,
        periodeLabel: IndicateurPeriodes.format(periode),
      };
    }) || [];

  return {
    indicateurId: data?.definition.id,
    dernierePeriodeModePrive,
    periodes: getPeriodesDistinctes(sources),
    sources,
    donneesCollectivite,
    valeursExistantes,
  };
};

function getPeriodesDistinctes(sources: PreparedSource[]): IndicateurPeriode[] {
  const toutesValeurs = sources.flatMap((sourceData) => sourceData.valeurs);
  return IndicateurPeriodes.merge(toutesValeurs.map((value) => value.periode));
}
