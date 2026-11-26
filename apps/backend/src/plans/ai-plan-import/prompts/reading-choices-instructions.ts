import type {
  ActionLevel,
  EtapesFrom,
  ImportDoubtKind,
  ReadingChoices,
} from '../models/import-question';

// Lus à l'élément, les éléments énumérés arrivent déjà en fiches sous le
// sous-axe de leur titre, comme avant la question : pas de consigne.
const ACTION_LEVEL_INSTRUCTIONS: Record<
  EtapesFrom,
  Record<ActionLevel, string | null>
> = {
  fiche: {
    fiche:
      "Chaque fiche titrée « Fiche action … » est une action. Les étapes qu'elle titre « Action 1 – … », « Action 2 – … » sont ses sous-actions, jamais des actions distinctes.",
    etape:
      'Chaque étape titrée « Action 1 – … », « Action 2 – … » est une action distincte, rangée sous le sous-axe de sa fiche. Ne la ramenez pas en sous-action de la fiche.',
  },
  enumeration: {
    fiche:
      'Chaque titre qui énumère des actions (« A – … », « B – … » ou une liste à puces, sous une mesure ou un groupe d’actions) est une seule action. Les éléments qu’il énumère sont ses sous-actions, jamais des actions distinctes.',
    etape: null,
  },
};

const ALL_ACTIONS_INSTRUCTION =
  "Chaque action numérotée d'un tableau récapitulatif (« Action 12 : … ») est une action du plan, même quand aucune fiche ne la détaille : relevez-la avec le titre que lui donne le tableau, sous l'axe où il la range. Une action qui a aussi sa fiche n'est relevée qu'une fois.";

/** La consigne de chaque sorte de choix ; null quand il n'en demande pas. */
const READING_CHOICE_INSTRUCTIONS = {
  'action-level': ({ actionLevel, etapesFrom = 'fiche' }) =>
    actionLevel ? ACTION_LEVEL_INSTRUCTIONS[etapesFrom][actionLevel] : null,
  // Les thèmes se règlent dans les unités ou le squelette, avant l'extraction.
  'theme-grouping': () => null,
  // Sans elles, les récapitulatifs ne vont plus à l'extraction : le code suffit.
  'actions-without-fiche': ({ actionsWithoutFiche }) =>
    actionsWithoutFiche === 'all' ? ALL_ACTIONS_INSTRUCTION : null,
} satisfies Record<ImportDoubtKind, (choices: ReadingChoices) => string | null>;

/**
 * Les choix de l'utilisateur, quand le document les laissait : ils passent
 * par le bloc des consignes, qui prend le dessus sur les règles générales.
 * Sans choix, le prompt reste inchangé.
 */
export const withReadingChoicesInstructions = (
  instructions: string,
  choices: ReadingChoices | undefined
): string => {
  if (!choices) return instructions;
  const added = Object.values(READING_CHOICE_INSTRUCTIONS)
    .map((instructionOf) => instructionOf(choices))
    .filter((instruction): instruction is string => instruction !== null);
  return added.length === 0
    ? instructions
    : [...added, instructions.trim()].filter((part) => part !== '').join('\n');
};
