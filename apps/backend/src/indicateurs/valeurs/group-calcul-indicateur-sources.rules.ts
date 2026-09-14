import {
  COLLECTIVITE_SOURCE_ID,
  PCAET_COLLECTIVITE_SOURCE_ID,
  IndicateurPeriod,
  IndicateurPeriods,
} from '@tet/domain/indicateurs';
import type {
  CalculSourceGroup,
  CalculSourceGroups,
  CalculSourceValeur,
  IndicateurFormula,
  SourceCalculPolicy,
} from './calcul-indicateur.types';
import { isMoreRecentIndicateurSourceValeur } from './indicateur-source-valeur-recency.rules';

// SQL joins return null; in-memory writes may omit sourceId. Both denote
// the collectivité source, including when the initial row has been deleted.
export const normalizeCalculSourceId = (
  sourceId?: string | null
): string | null =>
  sourceId && sourceId !== COLLECTIVITE_SOURCE_ID ? sourceId : null;

export const getCalculSourceGroupKey = (
  collectiviteId: number,
  period: IndicateurPeriod,
  sourceId?: string | null,
  metadonneeId?: number | null
): string =>
  `${collectiviteId}_${IndicateurPeriods.key(period)}_${
    normalizeCalculSourceId(sourceId) ?? COLLECTIVITE_SOURCE_ID
  }${
    sourceId === PCAET_COLLECTIVITE_SOURCE_ID ? `_${metadonneeId ?? -1}` : ''
  }`;

const isMoreRecent = (
  candidate: CalculSourceValeur,
  current: CalculSourceValeur
) =>
  isMoreRecentIndicateurSourceValeur(
    {
      dateVersion: candidate.metadonneeDateVersion,
      metadonneeId: candidate.metadonneeId,
    },
    {
      dateVersion: current.metadonneeDateVersion,
      metadonneeId: current.metadonneeId,
    }
  );

/** Keep the same latest metadata version as the indicator read model. */
const addLatestSourceValeur = (
  group: CalculSourceGroup,
  valeur: CalculSourceValeur
): void => {
  const candidate = {
    ...valeur,
    sourceId: normalizeCalculSourceId(valeur.sourceId),
  };
  const index = group.valeurs.findIndex(
    (current) =>
      current.indicateurIdentifiant === candidate.indicateurIdentifiant &&
      current.sourceId === candidate.sourceId
  );
  if (index === -1) group.valeurs.push(candidate);
  else if (isMoreRecent(candidate, group.valeurs[index]))
    group.valeurs[index] = candidate;

  // PCAET metadata identifies a démarche; it is not a source version.
  if (group.sourceId === PCAET_COLLECTIVITE_SOURCE_ID) return;
  if (group.sourceId === null) {
    group.metadonneeId = null;
    return;
  }
  const latest = group.valeurs
    .filter(
      (current) =>
        current.sourceId === group.sourceId && current.metadonneeId !== null
    )
    .reduce<CalculSourceValeur | undefined>(
      (current, next) =>
        !current || isMoreRecent(next, current) ? next : current,
      undefined
    );
  // Extra sources can complete a group, but cannot own its metadata.
  group.metadonneeId = latest?.metadonneeId ?? -1;
};

/** Enrich an existing set of affected groups without inventing new periods. */
export const fillCalculSourceGroups = (
  { definition, references }: IndicateurFormula,
  valeurs: CalculSourceValeur[],
  policies: SourceCalculPolicy[],
  groups: CalculSourceGroups = {},
  allowCreation = true
): CalculSourceGroups => {
  const neededIdentifiants = new Set(
    references.map(({ identifiant }) => identifiant)
  );
  for (const valeur of valeurs) {
    if (!neededIdentifiants.has(valeur.indicateurIdentifiant)) continue;
    // A formula is evaluated independently for each available series. An
    // imposed target cannot produce another cadence; no conversion is inferred.
    if (
      definition.periodiciteMode === 'imposee' &&
      valeur.period.periodicite !== definition.periodicite
    )
      continue;
    const sourceId = normalizeCalculSourceId(valeur.sourceId);
    const sources = [
      sourceId,
      ...policies
        .filter((policy) =>
          policy.sourceCalculIds.includes(sourceId ?? COLLECTIVITE_SOURCE_ID)
        )
        .map((policy) => normalizeCalculSourceId(policy.sourceId)),
    ];
    for (const groupSourceId of new Set(sources)) {
      const metadonneeId =
        groupSourceId === sourceId ? valeur.metadonneeId : -1;
      const key = getCalculSourceGroupKey(
        valeur.collectiviteId,
        valeur.period,
        groupSourceId,
        metadonneeId
      );
      const discoveryKey = getCalculSourceGroupKey(
        valeur.collectiviteId,
        valeur.period,
        groupSourceId,
        -1
      );
      const discoversPcaetGroup =
        groupSourceId === PCAET_COLLECTIVITE_SOURCE_ID &&
        groupSourceId === sourceId &&
        Boolean(groups[discoveryKey]);
      if (!groups[key] && (allowCreation || discoversPcaetGroup)) {
        groups[key] = {
          collectiviteId: valeur.collectiviteId,
          period: valeur.period,
          sourceId: groupSourceId,
          metadonneeId,
          valeurs: [],
        };
      }
    }
  }
  // Populate after discovering all groups: shared sources can precede the
  // PCAET observations in an unordered SQL result.
  for (const valeur of valeurs) {
    if (valeur.deleted || !neededIdentifiants.has(valeur.indicateurIdentifiant))
      continue;
    const sourceId = normalizeCalculSourceId(valeur.sourceId);
    for (const group of Object.values(groups)) {
      if (
        group.collectiviteId !== valeur.collectiviteId ||
        IndicateurPeriods.key(group.period) !==
          IndicateurPeriods.key(valeur.period)
      )
        continue;
      const isDirect = group.sourceId === sourceId;
      if (
        isDirect &&
        sourceId === PCAET_COLLECTIVITE_SOURCE_ID &&
        group.metadonneeId !== valeur.metadonneeId
      )
        continue;
      const isExtra = policies.some(
        (policy) =>
          normalizeCalculSourceId(policy.sourceId) === group.sourceId &&
          policy.sourceCalculIds.includes(sourceId ?? COLLECTIVITE_SOURCE_ID)
      );
      if (isDirect || isExtra) addLatestSourceValeur(group, valeur);
    }
  }

  return groups;
};
