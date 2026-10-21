import { DisableableField } from '../../models/disableable-field';
import { ExtractedAction } from '../../models/extracted-action';
import { DocumentPage } from '../document/document-page';
import { titlesMatch } from '../extract-actions/similar-titles';
import { buildSheetPage } from '../read-document/read-tabular';
import { SourceChunks } from '../source-chunks/source-chunks';
import {
  buildTabularActions,
  ComplementLines,
  formatIndicator,
  TabularPlanSheet,
} from './build-tabular-actions';
import {
  classifySheets,
  SheetClassification,
  SheetRole,
} from './classify-sheets';
import { matchColumnLabel } from './match-column-label';
import { renderTabularFiche } from './render-tabular-fiche';
import { collapseSpaces, SheetGrid, sheetLabel } from './sheet-grid';
import { ColumnLayout, findAxisTitle, SheetShape } from './sheet-layout';

export type SheetAnalysis = {
  name: string;
  role: SheetRole;
  reason: string;
  shape: SheetShape | null;
  /** Part des contrôles de structure réussis. */
  confidence: number | null;
  /** Les contrôles de structure, réussis (✓) ou non (✗). */
  checks: string[];
  fiches: number;
  sousActions: number;
  complementOf?: string;
  columns: Pick<
    ColumnLayout,
    'letter' | 'label' | 'role' | 'level' | 'reason'
  >[];
};

export type WorkbookAnalysis = {
  /** Les actions des onglets plan, construites sans le modèle. */
  actions: ExtractedAction[];
  /** Le texte source de chaque action, une tranche par action. */
  source: SourceChunks;
  /** Les onglets que le code n'a pas su lire : au modèle. */
  modelPages: DocumentPage[];
  sheets: SheetAnalysis[];
  warnings: string[];
};

// Un nom d'onglet qui ne dit rien de l'axe : « Feuil1 », « Plan d'actions ».
const GENERIC_SHEET_NAME =
  /^(?:feuil(?:le)?|sheet|onglet|tableau|plan(?: d['’]actions?)?|actions?|fiches?(?:[\s-]actions?)?|suivi|donn[ée]es|data)?[\s_-]*\d*$/i;

/**
 * Lit un classeur sans le modèle : le rôle de chaque onglet, les actions des
 * onglets plan avec leurs compléments, et les onglets à confier au modèle.
 */
export const analyzeWorkbook = (
  workbook: SheetGrid[],
  { disabledFields = [] }: { disabledFields?: DisableableField[] } = {}
): WorkbookAnalysis => {
  const classified = classifySheets(workbook);
  const plans = classified.filter(({ role }) => role === 'plan');
  // Une fiche-formulaire est un onglet par fiche : elle ne fait pas d'un
  // tableau voisin un onglet par axe.
  const tablePlanCount = plans.filter(({ layout }) => !layout?.form).length;
  const warnings: string[] = [];
  const complementLines = readAllComplementLines(classified, warnings);

  const actions: ExtractedAction[] = [];
  const chunks: string[] = [];
  const builtBySheet = new Map<number, { sousActions: number }>();
  for (const plan of plans) {
    const layout = plan.layout;
    if (!layout) {
      continue;
    }
    const sheet: TabularPlanSheet = {
      grid: workbook[plan.index],
      layout,
      axisPrefix: readAxisPrefix(plan, tablePlanCount),
    };
    warnings.push(...layout.warnings, ...describeUnreadCells(sheet));
    if (layout.uncoveredRows > 0) {
      warnings.push(
        `${sheetLabel(plan.name)} : ${
          layout.uncoveredRows
        } rangées sans titre de fiche ignorées.`
      );
    }
    const built = buildTabularActions(sheet, {
      complements: complementLines,
      disabledFields,
    });
    warnings.push(...built.warnings);
    for (const { action, fiche } of built.fiches) {
      actions.push(action);
      chunks.push(renderTabularFiche(sheet, fiche));
    }
    builtBySheet.set(plan.index, {
      sousActions: built.fiches.reduce(
        (total, { action }) => total + action.sousActions.length,
        0
      ),
    });
  }

  for (const sheet of classified) {
    const warning = describeIgnoredSheet(sheet);
    if (warning) {
      warnings.push(warning);
    }
  }

  return {
    actions,
    source: { chunks, chunkIndexByAction: chunks.map((_, index) => index) },
    modelPages: classified
      .filter(({ role }) => role === 'modele')
      .map(({ index }) => buildSheetPage(workbook[index], index)),
    sheets: classified.map((sheet) =>
      describeSheet(sheet, builtBySheet.get(sheet.index)?.sousActions ?? 0)
    ),
    warnings,
  };
};

/**
 * L'axe que porte l'onglet entier : un titre « Axe 1 – … » au-dessus du
 * tableau, ou son nom quand chaque onglet est un axe. Une fiche-formulaire
 * sans champ d'axe prend aussi le nom de son onglet.
 */
const readAxisPrefix = (
  plan: SheetClassification,
  tablePlanCount: number
): string[] => {
  const layout = plan.layout;
  if (!layout) {
    return [];
  }
  const axisTitle = findAxisTitle(layout);
  if (axisTitle) {
    return [axisTitle];
  }
  const name = plan.name.trim();
  if (GENERIC_SHEET_NAME.test(name)) {
    return [];
  }
  if (layout.form) {
    const [fiche] = layout.fiches;
    return fiche && fiche.path.length === 0 && !titlesMatch(name, fiche.titre)
      ? [name]
      : [];
  }
  return tablePlanCount >= 2 ? [name] : [];
};

/**
 * Les cellules des fiches dont le tableur n'a pas gardé de valeur lisible :
 * une erreur (« #REF! », « #N/A »), ou une formule jamais calculée (un
 * fichier écrit par un autre outil). Elles sont lues vides.
 */
const describeUnreadCells = ({ grid, layout }: TabularPlanSheet): string[] => {
  const cells = layout.fiches
    .flatMap(({ rows }) => rows)
    .flatMap((row) => grid.cells[row - 1] ?? []);
  const errors = cells.filter(({ kind }) => kind === 'error').length;
  const uncomputed = cells.filter(
    ({ formula, kind, text }) =>
      formula !== undefined && kind !== 'error' && text === ''
  ).length;
  return [
    ...(errors > 0
      ? [
          `${sheetLabel(
            grid.name
          )} : ${errors} cellule(s) en erreur (#REF!, #N/A…) lues comme vides.`,
        ]
      : []),
    ...(uncomputed > 0
      ? [
          `${sheetLabel(
            grid.name
          )} : ${uncomputed} formule(s) sans valeur calculée, lues comme vides ; ouvrir et enregistrer le fichier dans un tableur les calcule.`,
        ]
      : []),
  ];
};

/**
 * Les indicateurs (et leurs cibles) des onglets compléments, par fiche du
 * plan qu'ils complètent.
 */
const readAllComplementLines = (
  classified: SheetClassification[],
  warnings: string[]
): ComplementLines => {
  const lines: ComplementLines = new Map();
  for (const complement of classified) {
    const plan = classified.find(
      ({ name, role }) => role === 'plan' && name === complement.complementOf
    );
    if (
      complement.role !== 'complement' ||
      !complement.layout ||
      !plan?.layout
    ) {
      continue;
    }
    const { layout } = complement;
    const indicatorCol =
      layout.columns.find(({ role }) => role === 'indicateur')?.col ??
      layout.columns.find(
        ({ role, label }) =>
          role === 'sousAction' && matchColumnLabel(label) === 'indicateur'
      )?.col ??
      null;
    const cibleCol =
      layout.columns.find(({ role }) => role === 'cible')?.col ?? null;
    if (indicatorCol === null) {
      warnings.push(
        `${sheetLabel(complement.name)} : il complète les fiches de « ${
          plan.name
        } » sans colonne d'indicateurs ; son contenu n'est pas importé.`
      );
      continue;
    }
    const extraColumns = layout.columns.filter(({ role }) => role === 'autre');
    const unmatched: string[] = [];
    const matchedByNumero: string[] = [];
    layout.fiches.forEach((fiche, index) => {
      const match = complement.matches?.[index];
      const target =
        match === null || match === undefined
          ? undefined
          : plan.layout?.fiches[match];
      if (!target) {
        unmatched.push(
          fiche.numero ? `n°${fiche.numero}` : `« ${fiche.titre} »`
        );
        return;
      }
      if (!titlesMatch(target.titre, fiche.titre)) {
        matchedByNumero.push(`n°${fiche.numero} « ${fiche.titre} »`);
      }
      const ficheLines = fiche.rows.flatMap((row) => {
        const indicateur = collapseSpaces(layout.valueAt(row, indicatorCol));
        if (indicateur === '') {
          return [];
        }
        const extras = extraColumns.flatMap(({ col, letter, label }) => {
          const value = collapseSpaces(layout.valueAt(row, col));
          return value === '' ? [] : [`${label || letter} : ${value}`];
        });
        const line = formatIndicator(
          indicateur,
          cibleCol === null ? '' : layout.valueAt(row, cibleCol)
        );
        return [extras.length === 0 ? line : `${line} ; ${extras.join(' ; ')}`];
      });
      lines.set(target, [...(lines.get(target) ?? []), ...ficheLines]);
    });
    if (unmatched.length > 0) {
      warnings.push(
        `${sheetLabel(complement.name)} : fiches introuvables dans « ${
          plan.name
        } », leurs indicateurs ne sont pas importés : ${unmatched.join(', ')}.`
      );
    }
    if (matchedByNumero.length > 0) {
      warnings.push(
        `${sheetLabel(
          complement.name
        )} : fiches rattachées par leur seul n°, leur titre diffère de celui de « ${
          plan.name
        } » : ${matchedByNumero.join(', ')}.`
      );
    }
    if (extraColumns.length > 0) {
      warnings.push(
        `${sheetLabel(
          complement.name
        )} : colonnes non reconnues, reprises avec les indicateurs : ${extraColumns
          .map(({ letter, label }) =>
            label ? `${letter} « ${label} »` : letter
          )
          .join(', ')}.`
      );
    }
  }
  return lines;
};

const describeIgnoredSheet = (sheet: SheetClassification): string | null => {
  switch (sheet.role) {
    case 'synthese':
      return `${sheetLabel(sheet.name)} ignoré : tableau de synthèse (${
        sheet.reason
      }).`;
    case 'masque':
      return `${sheetLabel(sheet.name)} ignoré : il est masqué.`;
    case 'liste':
      return `${sheetLabel(sheet.name)} ignoré : ${sheet.reason}.`;
    case 'modele':
      return `${sheetLabel(sheet.name)} confié au modèle : ${sheet.reason}.`;
    default:
      return null;
  }
};

const describeSheet = (
  sheet: SheetClassification,
  sousActions: number
): SheetAnalysis => ({
  name: sheet.name,
  role: sheet.role,
  reason: sheet.reason,
  shape: sheet.layout?.shape ?? null,
  confidence: sheet.layout?.confidence ?? null,
  checks: sheet.layout?.reasons ?? [],
  fiches: sheet.layout?.fiches.length ?? 0,
  sousActions,
  ...(sheet.complementOf ? { complementOf: sheet.complementOf } : {}),
  columns: (sheet.layout?.columns ?? []).map(
    ({ letter, label, role, level, reason }) => ({
      letter,
      label,
      role,
      level,
      reason,
    })
  ),
});
