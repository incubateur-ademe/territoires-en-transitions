import { mapProgressValue } from './map-tabular-statut';
import {
  areCompatibleRoles,
  ColumnRole,
  describeColumnRole,
  LabelRole,
} from './match-column-label';
import {
  ColumnProfile,
  isPiloteLikeColumn,
  parseDateValue,
  ReadValue,
  ROLE_SHARE,
  yearOf,
} from './profile-columns';
import { columnLetter, sheetLabel } from './sheet-grid';
import { ColumnLayout, ColumnLevel, FicheBlock } from './sheet-layout';

export const STATUT_SHARE = 0.6;

/** Les rôles qui font la structure d'un tableau, jamais un attribut. */
export const STRUCTURAL_ROLES: ReadonlySet<ColumnRole> = new Set([
  'hierarchie',
  'titre',
  'sousAction',
  'numero',
]);

const YEAR_ONLY = /^\s*(?:19|20)\d{2}\s*$/;

/** Le rôle et le niveau de lecture de chaque colonne qui n'est pas la structure. */
export const describeAttributes = ({
  profiles,
  roleOfLabel,
  fiches,
  perRow,
  valueAt,
  listValues,
}: {
  profiles: ColumnProfile[];
  roleOfLabel: (profile: ColumnProfile) => LabelRole | null;
  fiches: FicheBlock[];
  perRow: boolean;
  valueAt: ReadValue;
  listValues?: ReadonlySet<string>;
}): ColumnLayout[] => {
  const layouts = profiles.map((profile): ColumnLayout => {
    const { role, reason, year } = classifyAttribute(
      profile,
      roleOfLabel(profile),
      listValues
    );
    return {
      col: profile.col,
      letter: columnLetter(profile.col),
      label: profile.label,
      role,
      level: perRow ? 'fiche' : readAttributeLevel(profile, fiches, valueAt),
      ...(year !== undefined ? { year } : {}),
      reason,
    };
  });
  return settleBudgets(layouts);
};

const classifyAttribute = (
  profile: ColumnProfile,
  labelRole: LabelRole | null,
  listValues?: ReadonlySet<string>
): { role: ColumnRole; reason: string; year?: number } => {
  if (profile.filledRows === 0) {
    return labelRole === 'budgetConsomme'
      ? { role: 'budgetConsomme', reason: 'libellé, colonne vide' }
      : { role: 'vide', reason: 'aucune valeur' };
  }
  if (profile.crossShare >= ROLE_SHARE) {
    return profile.labelYear !== null
      ? {
          role: 'calendrier',
          year: profile.labelYear,
          reason: `croix sous l'année ${profile.labelYear}`,
        }
      : { role: 'autre', reason: 'croix sans année au-dessus' };
  }
  // Une date ne se range dans la fiche que si le libellé dit laquelle : une
  // date de mise à jour n'est pas une échéance.
  if (
    (labelRole === 'dateDebut' || labelRole === 'dateFin') &&
    shareOfBlocks(
      profile,
      (value) =>
        parseDateValue(value, { serial: true }) !== null ||
        YEAR_ONLY.test(value)
    ) >= ROLE_SHARE
  ) {
    return { role: labelRole, reason: 'dates, libellé' };
  }
  if (
    labelRole === 'statut' &&
    shareOfBlocks(profile, (value) => mapProgressValue(value) !== null) >=
      ROLE_SHARE
  ) {
    return { role: 'statut', reason: 'avancement chiffré, libellé' };
  }
  if (profile.numericShare >= ROLE_SHARE) {
    if (
      labelRole === 'budget' ||
      labelRole === 'budgetConsomme' ||
      labelRole === 'financements' ||
      labelRole === 'cible'
    ) {
      return { role: labelRole, reason: 'montants ou nombres, libellé' };
    }
    if (profile.blocks.some(({ value }) => /€|euro/i.test(value))) {
      return { role: 'budget', reason: 'montants en euros' };
    }
    return { role: 'autre', reason: 'nombres sans libellé reconnu' };
  }
  if (profile.isClosedList) {
    if (profile.statutShare >= STATUT_SHARE) {
      return { role: 'statut', reason: "valeurs d'avancement connues" };
    }
    if (
      listValues &&
      labelRole !== 'priorite' &&
      coverage(profile, listValues) >= ROLE_SHARE
    ) {
      return { role: 'statut', reason: "valeurs d'un onglet de liste" };
    }
    if (labelRole === 'statut' || labelRole === 'priorite') {
      return { role: labelRole, reason: 'liste fermée, libellé' };
    }
  }
  // Un avancement rédigé n'est pas un statut : il reste lisible en
  // description, sous son libellé.
  if (labelRole === 'statut' && profile.statutShare < STATUT_SHARE) {
    return {
      role: 'autre',
      reason: "texte libre sous un libellé d'avancement",
    };
  }
  if (labelRole === 'calendrier') {
    return profile.blocks.some(({ value }) => /(19|20)\d{2}/.test(value))
      ? { role: 'calendrier', reason: 'années en texte' }
      : { role: 'autre', reason: 'calendrier sans année' };
  }
  // Des noms de structures se lisent pilotes, sauf si le libellé dit qui
  // ils sont : partenaires, financeurs.
  if (labelRole && !STRUCTURAL_ROLES.has(labelRole)) {
    return { role: labelRole, reason: 'texte, libellé' };
  }
  if (isPiloteLikeColumn(profile)) {
    return { role: 'structurePilote', reason: 'sigles et noms de structures' };
  }
  return { role: 'autre', reason: 'contenu et libellé non reconnus' };
};

const shareOfBlocks = (
  profile: ColumnProfile,
  predicate: (value: string) => boolean
): number =>
  profile.blocks.length === 0
    ? 0
    : profile.blocks.filter(({ value }) => predicate(value)).length /
      profile.blocks.length;

const coverage = (
  profile: ColumnProfile,
  values: ReadonlySet<string>
): number => {
  const own = profile.blocks.map(({ value }) => value.trim().toLowerCase());
  return own.filter((value) => values.has(value)).length / own.length;
};

/**
 * Une valeur par fiche (fusionnée, répétée sur toutes ses rangées, ou sur
 * sa première seulement) se lit au niveau de la fiche ; sinon, rangée par
 * rangée.
 */
const readAttributeLevel = (
  profile: ColumnProfile,
  fiches: FicheBlock[],
  valueAt: ReadValue
): ColumnLevel => {
  let repeated = 0;
  let firstOnly = 0;
  let present = 0;
  for (const { rows } of fiches) {
    const values = rows.map((row) => valueAt(row, profile.col));
    const filled = values.filter((value) => value !== '');
    if (new Set(filled).size > 1) {
      return 'row';
    }
    if (rows.length < 2 || filled.length === 0) {
      continue;
    }
    present += 1;
    if (filled.length === rows.length) {
      repeated += 1;
    } else if (filled.length === 1 && values[0] !== '') {
      firstOnly += 1;
    }
  }
  if (profile.hasVerticalMerges || present === 0) {
    return 'fiche';
  }
  return repeated + firstOnly === present ? 'fiche' : 'row';
};

/**
 * Plusieurs colonnes de montants. Un budget par année (« Budget 2025 »,
 * « Budget 2026 ») se somme, sauf s'il y a un total : le détail reste alors
 * lisible en description. Sinon, la première colonne, ou celle qui se dit
 * budget, l'est ; les autres (« Montant » d'un financeur) sont des
 * financements.
 */
const settleBudgets = (layouts: ColumnLayout[]): ColumnLayout[] => {
  const budgets = layouts.filter(({ role }) => role === 'budget');
  const yearly = findYearlyColumns(budgets);
  const total = budgets.find(
    (layout) => !yearly.includes(layout) && /total/i.test(layout.label)
  );
  if (yearly.length >= 2) {
    return layouts.map((layout) => {
      if (yearly.includes(layout)) {
        return total
          ? { ...layout, role: 'autre', reason: 'détail annuel du budget' }
          : { ...layout, reason: 'budget annuel, sommé' };
      }
      return layout.role === 'budget' && layout !== total
        ? { ...layout, role: 'financements', isSecondaryAmount: true }
        : layout;
    });
  }
  const mainBudget =
    budgets.find(({ label }) => /budget|total|pr[ée]visionnel/i.test(label)) ??
    budgets[0];
  return layouts.map((layout) =>
    layout.role === 'budget' && layout !== mainBudget
      ? {
          ...layout,
          role: 'financements',
          reason: 'second montant',
          isSecondaryAmount: true,
        }
      : layout
  );
};

/** Les colonnes dont les libellés ne diffèrent que par l'année. */
const findYearlyColumns = (layouts: ColumnLayout[]): ColumnLayout[] => {
  const byStem = new Map<string, ColumnLayout[]>();
  for (const layout of layouts) {
    if (yearOf(layout.label) === null) {
      continue;
    }
    const stem = layout.label
      .replace(/(?:19|20)\d{2}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    byStem.set(stem, [...(byStem.get(stem) ?? []), layout]);
  }
  return [...byStem.values()].find((group) => group.length >= 2) ?? [];
};

/** Un libellé qui annonce autre chose que ce que la colonne contient (« PILOTE »). */
export const describeLabelConflicts = (
  sheet: string,
  columns: ColumnLayout[],
  roleOfLabel: (col: number) => LabelRole | null
): string[] =>
  columns.flatMap((column) => {
    const labelRole = roleOfLabel(column.col);
    if (
      labelRole === null ||
      column.role === 'vide' ||
      column.role === 'autre' ||
      areCompatibleRoles(labelRole, column.role)
    ) {
      return [];
    }
    return [
      `${sheetLabel(sheet)}, colonne ${column.letter} : le libellé « ${
        column.label
      } » annonce ${describeColumnRole(
        labelRole
      )}, mais le contenu est lu comme ${describeColumnRole(column.role)}.`,
    ];
  });
