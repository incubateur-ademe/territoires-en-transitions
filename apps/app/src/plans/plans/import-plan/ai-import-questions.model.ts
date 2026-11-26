import type { RouterInput, RouterOutput } from '@tet/api';

export type ImportQuestion = NonNullable<
  RouterOutput['plans']['aiImport']['getAiImportStatus']['question']
>;
export type ImportDoubt = ImportQuestion['doubts'][number];
export type ImportDoubtKind = ImportDoubt['kind'];
export type ImportChoice =
  RouterInput['plans']['aiImport']['answerAiImportQuestion']['choices'][number];

export type DoubtOf<K extends ImportDoubtKind> = Extract<
  ImportDoubt,
  { kind: K }
>;
export type ChoiceOf<K extends ImportDoubtKind> = Extract<
  ImportChoice,
  { kind: K }
>;

/** Une réponse par sorte de doute posé. */
export type ImportChoices = { [K in ImportDoubtKind]?: ChoiceOf<K> };

/** Ce qu'obtient l'utilisateur qui continue sans rien changer. */
export const proposedChoiceOf = (doubt: ImportDoubt): ImportChoice => {
  switch (doubt.kind) {
    case 'action-level':
      return { kind: 'action-level', actionLevel: doubt.proposed };
    case 'theme-grouping':
      return { kind: 'theme-grouping', grouping: doubt.proposed };
    case 'actions-without-fiche':
      return { kind: 'actions-without-fiche', actions: doubt.proposed };
  }
};

export const proposedChoicesOf = (doubts: ImportDoubt[]): ImportChoices =>
  Object.fromEntries(
    doubts.map((doubt) => [doubt.kind, proposedChoiceOf(doubt)])
  );

/** Les choix envoyés : un par doute posé, dans l'ordre des doutes. */
export const choicesToSend = (
  doubts: ImportDoubt[],
  choices: ImportChoices
): ImportChoice[] =>
  doubts.map((doubt) => choices[doubt.kind] ?? proposedChoiceOf(doubt));

const sameChoice = (a: ImportChoice, b: ImportChoice): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Le suivi de la réponse. `actionLevel` et `proposed` restent ceux du niveau
 * de l'action, que les graphiques existants lisent.
 */
export const answerTrackingProperties = (
  doubts: ImportDoubt[],
  choices: ImportChoice[]
) => {
  const actionLevelDoubt = doubts.find(
    (doubt): doubt is DoubtOf<'action-level'> => doubt.kind === 'action-level'
  );
  const actionLevelChoice = choices.find(
    (choice): choice is ChoiceOf<'action-level'> =>
      choice.kind === 'action-level'
  );
  return {
    questionKinds: doubts.map(({ kind }) => kind),
    questionCount: doubts.length,
    changedKinds: doubts
      .filter((doubt) => {
        const choice = choices.find(({ kind }) => kind === doubt.kind);
        return (
          choice !== undefined && !sameChoice(choice, proposedChoiceOf(doubt))
        );
      })
      .map(({ kind }) => kind),
    ...(actionLevelDoubt && {
      actionLevel: actionLevelChoice?.actionLevel,
      proposed: actionLevelDoubt.proposed,
    }),
  };
};
