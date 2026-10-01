import {
  COLLECTIVITE_SOURCE_ID,
  toAnnualIndicateurYear,
  IndicateurAvecValeursParSource,
  IndicateurValeurGroupee,
} from '@tet/domain/indicateurs';
import {
  IndicateurAssocie,
  ScoreIndicatifActionValeurUtilisable,
  ScoreIndicatifType,
  scoreIndicatifTypeEnum,
  ValeurUtilisee,
} from '@tet/domain/referentiels';
import { groupBy, mapValues } from 'es-toolkit';

/**
 * Prépare les données pour fournir les valeurs utilisables des indicateurs
 * associés à une action
 */
export function mapActionIdToValeurUtilisable(
  actionId: string,
  indicateursAssocies: IndicateurAssocie[],
  valeursGroupees: { indicateurs: IndicateurAvecValeursParSource[] },
  valeursUtiliseesParActionId: Record<string, ValeurUtilisee[]>
): ScoreIndicatifActionValeurUtilisable {
  return {
    actionId,
    indicateurs: indicateursAssocies
      .filter((ind) => ind.actionId === actionId)
      .map((ind) =>
        mapIndicateurToValeurUtilisable(
          ind,
          valeursGroupees,
          valeursUtiliseesParActionId[actionId] || []
        )
      )
      .filter((ind): ind is NonNullable<typeof ind> => ind !== null),
  };
}

/**
 * Prépare les données pour fournir une valeur utilisable d'un indicateur
 * associé à une action
 */
export function mapIndicateurToValeurUtilisable(
  indicateur: IndicateurAssocie,
  valeursGroupees: { indicateurs: IndicateurAvecValeursParSource[] },
  valeursUtilisees: ValeurUtilisee[]
): ScoreIndicatifActionValeurUtilisable['indicateurs'][number] | null {
  const { indicateurId, identifiantReferentiel, unite, titre } = indicateur;
  const sourcesObj = valeursGroupees.indicateurs.find(
    (ind) => ind.definition.id === indicateurId
  )?.sources;

  if (!sourcesObj) return null;

  const valeursUtiliseesParTypeScore = mapValues(
    groupBy(valeursUtilisees, (v) => v.typeScore),
    (valeurs) => valeurs.map((v) => v.indicateurValeurId)
  );

  const selection: Record<
    ScoreIndicatifType,
    {
      id: number;
      annee: number;
      source: string;
      valeur: number;
    } | null
  > = { fait: null, programme: null };

  const transformeValeur = (
    v: IndicateurValeurGroupee,
    typeScore: ScoreIndicatifType,
    source: string
  ) => {
    const utilisee = Boolean(
      valeursUtiliseesParTypeScore[typeScore]?.includes(v.id)
    );
    const valeur = (
      typeScore === scoreIndicatifTypeEnum.FAIT ? v.resultat : v.objectif
    ) as number;
    const annee = toAnnualIndicateurYear(
      v.periodicite,
      v.dateValeur,
      `Le score indicatif (${identifiantReferentiel})`
    );
    if (utilisee) {
      selection[typeScore] = { id: v.id, annee, source, valeur };
    }
    return {
      id: v.id,
      valeur,
      dateValeur: v.dateValeur,
      annee,
      utilisee,
    };
  };

  const mapValeurs = (
    s: IndicateurAvecValeursParSource['sources'][string],
    typeScore: ScoreIndicatifType
  ) => {
    const field =
      typeScore === scoreIndicatifTypeEnum.FAIT ? 'resultat' : 'objectif';
    return s.valeurs
      .filter((v) => typeof v[field] === 'number')
      .map((v) => transformeValeur(v, typeScore, s.source));
  };

  const getOrdreAffichage = (
    s: IndicateurAvecValeursParSource['sources'][string]
  ) =>
    (s.source === COLLECTIVITE_SOURCE_ID
      ? 0
      : s.ordreAffichage === null
      ? 1000
      : s.ordreAffichage) as number;

  return {
    indicateurId,
    identifiantReferentiel,
    unite,
    titre,
    periodicite: 'annuelle',
    selection,
    sources: Object.values(sourcesObj)
      .map((s) => ({
        source: s.source,
        libelle: s.source === COLLECTIVITE_SOURCE_ID ? null : s.libelle,
        ordreAffichage: getOrdreAffichage(s),
        fait: mapValeurs(s, scoreIndicatifTypeEnum.FAIT),
        programme: mapValeurs(s, scoreIndicatifTypeEnum.PROGRAMME),
      }))
      .sort((a, b) => a.ordreAffichage - b.ordreAffichage),
  };
}
