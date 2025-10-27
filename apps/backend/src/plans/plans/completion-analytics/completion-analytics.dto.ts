export type CompletionFieldName =
  | 'titre'
  | 'description'
  | 'statut'
  | 'pilotes'
  | 'objectifs'
  | 'indicateurs'
  | 'budgets'
  | 'suiviRecent';

export type CompletionField = {
  name: CompletionFieldName;
  count: number;
};
