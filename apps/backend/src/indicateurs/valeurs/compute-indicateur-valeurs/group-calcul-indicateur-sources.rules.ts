import {
  COLLECTIVITE_SOURCE_ID,
  INDICATEUR_SOURCES_WITH_DEDICATED_METADATA,
  IndicateurPeriode,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import type {
  CalculSourceGroup,
  CalculSourceGroups,
  CalculSourceValeur,
  IndicateurFormula,
  SourceCalculPolicy,
} from './calcul-indicateur.types';
import { isMoreRecentIndicateurSourceValeur } from '../indicateur-source-valeur-recency.rules';

// SQL joins return null; in-memory writes may omit sourceId. Both denote
// the collectivité source, including when the initial row has been deleted.
export const normalizeCalculSourceId = (
  sourceId?: string | null
): string | null =>
  sourceId && sourceId !== COLLECTIVITE_SOURCE_ID ? sourceId : null;

export const getCalculSourceGroupKey = (
  collectiviteId: number,
  periode: IndicateurPeriode,
  sourceId?: string | null,
  metadonneeId?: number | null
): string =>
  `${collectiviteId}_${IndicateurPeriodes.key(periode)}_${
    normalizeCalculSourceId(sourceId) ?? COLLECTIVITE_SOURCE_ID
  }${
    INDICATEUR_SOURCES_WITH_DEDICATED_METADATA.includes(sourceId ?? '')
      ? `_${metadonneeId ?? -1}`
      : ''
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

  // Dedicated metadata identifies a démarche or plan, not a source version.
  if (INDICATEUR_SOURCES_WITH_DEDICATED_METADATA.includes(group.sourceId ?? ''))
    return;
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
  { definition: indicateur, references }: IndicateurFormula,
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
    // Stored calculations always follow the target definition's cadence.
    if (valeur.periode.periodicite !== indicateur.periodicite) continue;
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
        valeur.periode,
        groupSourceId,
        metadonneeId
      );
      const discoveryKey = getCalculSourceGroupKey(
        valeur.collectiviteId,
        valeur.periode,
        groupSourceId,
        -1
      );
      const discoversMetadataGroup =
        INDICATEUR_SOURCES_WITH_DEDICATED_METADATA.includes(
          groupSourceId ?? ''
        ) &&
        groupSourceId === sourceId &&
        Boolean(groups[discoveryKey]);
      if (!groups[key] && (allowCreation || discoversMetadataGroup)) {
        groups[key] = {
          collectiviteId: valeur.collectiviteId,
          periode: valeur.periode,
          sourceId: groupSourceId,
          metadonneeId,
          valeurs: [],
          requiresDirectValueForField:
            policies.find(
              (policy) =>
                normalizeCalculSourceId(policy.sourceId) === groupSourceId
            )?.requiresDirectValueForField ?? false,
        };
      }
    }
  }
  // Populate after discovering all groups: shared sources can precede the
  // dedicated metadata observations in an unordered SQL result.
  const groupsByCollectivitePeriode = new Map<string, CalculSourceGroup[]>();
  for (const group of Object.values(groups)) {
    const key = `${group.collectiviteId}_${IndicateurPeriodes.key(
      group.periode
    )}`;
    const periodGroups = groupsByCollectivitePeriode.get(key) ?? [];
    periodGroups.push(group);
    groupsByCollectivitePeriode.set(key, periodGroups);
  }
  for (const valeur of valeurs) {
    if (valeur.deleted || !neededIdentifiants.has(valeur.indicateurIdentifiant))
      continue;
    const sourceId = normalizeCalculSourceId(valeur.sourceId);
    const key = `${valeur.collectiviteId}_${IndicateurPeriodes.key(
      valeur.periode
    )}`;
    for (const group of groupsByCollectivitePeriode.get(key) ?? []) {
      const isDirect = group.sourceId === sourceId;
      if (
        isDirect &&
        INDICATEUR_SOURCES_WITH_DEDICATED_METADATA.includes(sourceId ?? '') &&
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
