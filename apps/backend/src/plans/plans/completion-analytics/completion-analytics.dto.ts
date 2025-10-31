export const completionFields = [
  'titre',
  'description',
  'statut',
  'pilotes',
  'objectifs',
  'indicateurs',
  'budgets',
  'suiviRecent',
] as const;

export type CompletionFieldName = (typeof completionFields)[number];

export type CompletionField = {
  name: CompletionFieldName;
  count: number;
};
