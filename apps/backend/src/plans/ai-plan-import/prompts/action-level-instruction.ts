import type { ActionLevel } from '../models/import-question';

/**
 * Le choix de l'utilisateur, quand le document le laissait : il passe par le
 * bloc des consignes, qui prend le dessus sur la règle générale du niveau de
 * l'action. Sans choix, le prompt reste inchangé.
 */
const ACTION_LEVEL_INSTRUCTIONS: Record<ActionLevel, string> = {
  fiche:
    "Chaque fiche titrée « Fiche action … » est une action. Les étapes qu'elle titre « Action 1 – … », « Action 2 – … » sont ses sous-actions, jamais des actions distinctes.",
  etape:
    'Chaque étape titrée « Action 1 – … », « Action 2 – … » est une action distincte, rangée sous le sous-axe de sa fiche. Ne la ramenez pas en sous-action de la fiche.',
};

export const withActionLevelInstruction = (
  instructions: string,
  actionLevel: ActionLevel | undefined
): string =>
  actionLevel
    ? [ACTION_LEVEL_INSTRUCTIONS[actionLevel], instructions.trim()]
        .filter((part) => part !== '')
        .join('\n')
    : instructions;
