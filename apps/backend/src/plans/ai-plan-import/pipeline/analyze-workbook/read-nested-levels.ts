import { STATUT_SHARE, STRUCTURAL_ROLES } from './classify-column-attribute';
import { LabelRole } from './match-column-label';
import {
  ColumnProfile,
  GROUPING_MIN_DISTINCT,
  isNumberingColumn,
  isPiloteLikeColumn,
  isTextColumn,
  ROLE_SHARE,
} from './profile-columns';

/** Des colonnes aux mêmes frontières de blocs : un niveau de regroupement. */
export type Level = {
  profiles: ColumnProfile[];
  starts: Set<number>;
  /** Rangées où le niveau a une valeur : un sous-axe peut manquer. */
  filled: Set<number>;
};

const LEVEL_SIMILARITY = 0.95;
const GROUPING_MIN_FILL = 0.5;
const SPARSE_GROUPING_MIN_FILL = 0.2;
const GROUPING_MAX_RUNS = 0.9;

/**
 * Les niveaux de regroupement d'un tableau, du plus large au plus fin. Une
 * colonne écartée par son libellé (« Objectif ») ou parce que ses valeurs
 * forment une liste fermée (peu d'axes aux intitulés courts) revient quand
 * un niveau retenu s'emboîte dans ses blocs : c'est le contenu qui décide.
 */
export const readHierarchyLevels = (
  profiles: ColumnProfile[],
  roleOfLabel: (profile: ColumnProfile) => LabelRole | null
): Level[] => {
  const candidates = profiles.filter((profile) =>
    isGroupingCandidate(profile, roleOfLabel(profile))
  );
  const levels = readNestedLevels(candidates);
  const rescued = profiles.filter(
    (profile) =>
      !candidates.includes(profile) &&
      isSecondChanceCandidate(profile, roleOfLabel(profile)) &&
      levels.some((level) => isNestedIn(level, toLevel(profile)))
  );
  return rescued.length === 0
    ? levels
    : readNestedLevels([...candidates, ...rescued]);
};

/**
 * Une colonne qui regroupe des rangées : remplie, en blocs de plusieurs
 * rangées, dont la valeur ne revient pas d'un bloc à l'autre (au contraire
 * d'un statut ou d'un pilote).
 */
const hasGroupingShape = (
  profile: ColumnProfile,
  labelRole: LabelRole | null
): boolean =>
  (isTextColumn(profile) || isNumberingColumn(profile)) &&
  profile.fillRatio >=
    (isAxisLike(profile, labelRole)
      ? SPARSE_GROUPING_MIN_FILL
      : GROUPING_MIN_FILL) &&
  profile.multiRowBlocks >= 1 &&
  profile.blocks.length <= GROUPING_MAX_RUNS * profile.filledRows &&
  profile.distinctRatio >= GROUPING_MIN_DISTINCT &&
  profile.statutShare < STATUT_SHARE;

const isGroupingCandidate = (
  profile: ColumnProfile,
  labelRole: LabelRole | null
): boolean =>
  hasGroupingShape(profile, labelRole) &&
  (isAxisLike(profile, labelRole) || !isAttributeLabel(labelRole)) &&
  (isNumberingColumn(profile) ||
    // Peu d'axes, aux intitulés courts, font une liste fermée : le libellé
    // ou la numérotation des intitulés départagent.
    isAxisLike(profile, labelRole) ||
    (!profile.isClosedList && !isPiloteLikeColumn(profile)));

const isSecondChanceCandidate = (
  profile: ColumnProfile,
  labelRole: LabelRole | null
): boolean =>
  hasGroupingShape(profile, labelRole) &&
  !isPiloteLikeColumn(profile) &&
  (isAttributeLabel(labelRole)
    ? profile.hasVerticalMerges
    : profile.isClosedList);

/** Un libellé d'attribut (« Statut », « Budget ») : jamais un niveau d'axe. */
const isAttributeLabel = (role: LabelRole | null): boolean =>
  role !== null && !STRUCTURAL_ROLES.has(role);

const isAxisLike = (
  profile: ColumnProfile,
  labelRole: LabelRole | null
): boolean =>
  profile.headingShare >= ROLE_SHARE ||
  (labelRole === 'hierarchie' && !isPiloteLikeColumn(profile));

const toLevel = (profile: ColumnProfile): Level => ({
  profiles: [profile],
  starts: new Set(profile.blocks.map(({ rows }) => rows[0])),
  filled: new Set(profile.blocks.flatMap(({ rows }) => rows)),
});

/**
 * Les colonnes de regroupement réunies par frontières de blocs communes,
 * de la plus large à la plus fine. Un niveau qui ne découpe pas le précédent
 * n'est pas une hiérarchie : ses colonnes redeviennent des attributs.
 */
const readNestedLevels = (candidates: ColumnProfile[]): Level[] => {
  const levels: Level[] = [];
  for (const profile of [...candidates].sort(
    (a, b) => a.blocks.length - b.blocks.length
  )) {
    const candidate = toLevel(profile);
    const level = levels.find(
      (other) => jaccard(other.starts, candidate.starts) >= LEVEL_SIMILARITY
    );
    if (level) {
      level.profiles.push(profile);
      candidate.filled.forEach((row) => level.filled.add(row));
    } else {
      levels.push(candidate);
    }
  }
  // Un sous-axe facultatif a moins de blocs que l'axe qui le contient : on
  // range d'abord par emboîtement, puis par nombre de blocs.
  const parents = new Map(
    levels.map((level) => [
      level,
      levels.filter((other) => other !== level && isNestedIn(level, other))
        .length,
    ])
  );
  const nested: Level[] = [];
  for (const level of levels.sort(
    (a, b) =>
      (parents.get(a) ?? 0) - (parents.get(b) ?? 0) ||
      a.starts.size - b.starts.size
  )) {
    const coarser = nested.at(-1);
    if (!coarser || containment(coarser, level) >= LEVEL_SIMILARITY) {
      nested.push(level);
    }
  }
  return nested;
};

/**
 * Chaque bloc du niveau fin tient dans un seul bloc du niveau large, et l'un
 * au moins le découpe : un sous-axe facultatif qui ne recouvre qu'une fiche
 * n'est pas plus fin qu'elle.
 */
const isNestedIn = (fine: Level, coarse: Level): boolean => {
  const coarseBlocks = coarse.profiles[0].blocks;
  const blockOf = new Map<number, number>();
  coarseBlocks.forEach(({ rows }, index) =>
    rows.forEach((row) => blockOf.set(row, index))
  );
  let splits = false;
  for (const { rows } of fine.profiles[0].blocks) {
    const index = blockOf.get(rows[0]);
    if (index === undefined || rows.some((row) => blockOf.get(row) !== index)) {
      return false;
    }
    splits ||= rows.length < coarseBlocks[index].rows.length;
  }
  return splits;
};

const jaccard = (a: Set<number>, b: Set<number>): number => {
  const common = [...a].filter((value) => b.has(value)).length;
  return common / new Set([...a, ...b]).size;
};

/**
 * Part des frontières du niveau large qui sont aussi des frontières du fin,
 * là où le fin a une valeur.
 */
const containment = (coarse: Level, fine: Level): number => {
  const shared = [...coarse.starts].filter((row) => fine.filled.has(row));
  return shared.length === 0
    ? 0
    : shared.filter((row) => fine.starts.has(row)).length / shared.length;
};
