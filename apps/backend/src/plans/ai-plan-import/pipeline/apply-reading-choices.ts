import type { ReadingChoices, ThemeGroup } from '../models/import-question';
import type { PendingQuestion } from './pipeline-checkpoint';
import type { DocumentUnit } from './segment-document/document-unit';

/**
 * Les unités que lira le modèle une fois la réponse donnée, sans relire le
 * document. Un choix absent garde la lecture proposée par défaut.
 */
export const applyReadingChoices = (
  units: DocumentUnit[] | null,
  pending: PendingQuestion | null,
  choices: ReadingChoices
): DocumentUnit[] | null => {
  const read =
    pending?.unitsByLevel && choices.actionLevel
      ? pending.unitsByLevel[choices.actionLevel]
      : units;
  return read && choices.themeGrouping?.grouping === 'grouped'
    ? groupThemes(read, choices.themeGrouping.groups)
    : read;
};

/**
 * Chaque thème réuni prend le libellé de la synthèse : le squelette et la
 * structuration ne voient plus qu'un axe. Le thème est en tête du chemin aux
 * deux niveaux de lecture.
 */
const groupThemes = (
  units: DocumentUnit[],
  groups: ThemeGroup[]
): DocumentUnit[] => {
  const labelByTheme = new Map(
    groups.flatMap(({ label, variants }) =>
      variants.map(({ theme }) => [theme, label] as const)
    )
  );
  return units.map((unit) => {
    const [theme, ...rest] = unit.headingPath;
    const label = theme === undefined ? undefined : labelByTheme.get(theme);
    return label === undefined
      ? unit
      : { ...unit, headingPath: [label, ...rest] };
  });
};
