import { axisPathOf } from '../models/extracted-action';
import { WorkbookAnalysis } from '../pipeline/analyze-workbook/analyze-workbook';
import { SheetRole } from '../pipeline/analyze-workbook/classify-sheets';
import { describeColumnRole } from '../pipeline/analyze-workbook/match-column-label';
import { ColumnLevel } from '../pipeline/analyze-workbook/sheet-layout';

const LEVEL_LABELS: Record<ColumnLevel, string> = {
  axe: 'axe',
  fiche: 'fiche',
  row: 'rangée',
};

// La forme et la confiance d'une synthèse ou d'une liste ne disent rien.
const READ_ROLES: ReadonlySet<SheetRole> = new Set([
  'plan',
  'complement',
  'modele',
]);

/**
 * Ce que la lecture du classeur a compris, sans aucun modèle : rôle de
 * chaque onglet et de chaque colonne, arbre des axes et des fiches,
 * avertissements.
 */
export const describeWorkbookAnalysis = (
  analysis: WorkbookAnalysis
): string[] => [
  'Onglets :',
  ...analysis.sheets.flatMap((sheet) => [
    `  « ${sheet.name} » : ${sheet.role}${
      READ_ROLES.has(sheet.role) && sheet.shape ? `, forme ${sheet.shape}` : ''
    }${
      READ_ROLES.has(sheet.role) && sheet.confidence !== null
        ? `, confiance ${Math.round(sheet.confidence * 100)} %`
        : ''
    } (${sheet.reason})`,
    ...(sheet.role === 'plan' || sheet.role === 'modele'
      ? sheet.checks.map((check) => `      ${check}`)
      : []),
    ...(sheet.role === 'plan' || sheet.role === 'complement'
      ? sheet.columns
          .filter(({ role }) => role !== 'vide')
          .map(
            ({ letter, label, role, level, reason }) =>
              `    ${letter}${
                label ? ` « ${label} »` : ''
              } → ${describeColumnRole(role)} (${
                LEVEL_LABELS[level]
              } ; ${reason})`
          )
      : []),
  ]),
  '',
  `Arbre : ${analysis.actions.length} fiche(s), ${analysis.actions.reduce(
    (total, action) => total + action.sousActions.length,
    0
  )} sous-action(s)`,
  ...describeTree(analysis),
  '',
  `Onglets confiés au modèle : ${
    analysis.modelPages.map((page) => `« ${page.label ?? ''} »`).join(', ') ||
    'aucun'
  }`,
  '',
  `Avertissements (${analysis.warnings.length}) :`,
  ...analysis.warnings.map((warning) => `  ⚠ ${warning}`),
];

const describeTree = ({ actions }: WorkbookAnalysis): string[] => {
  const lines: string[] = [];
  let previous: string[] = [];
  for (const action of actions) {
    const path = axisPathOf(action);
    const common = path.findIndex(
      (segment, index) => segment !== previous[index]
    );
    const from = common === -1 ? path.length : common;
    path.slice(from).forEach((segment, offset) => {
      const depth = from + offset;
      const count = actions.filter((other) => {
        const otherPath = axisPathOf(other);
        return (
          otherPath.length > depth &&
          otherPath
            .slice(0, depth + 1)
            .every((part, index) => part === path[index])
        );
      }).length;
      lines.push(`${'  '.repeat(depth + 1)}▸ ${segment} (${count} fiche(s))`);
    });
    lines.push(
      `${'  '.repeat(path.length + 1)}• ${action.titre} — ${
        action.sousActions.length
      } sous-action(s)`
    );
    previous = path;
  }
  return lines;
};
