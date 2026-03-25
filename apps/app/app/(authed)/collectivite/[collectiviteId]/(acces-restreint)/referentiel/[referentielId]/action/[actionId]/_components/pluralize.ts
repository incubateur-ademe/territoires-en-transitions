export type LabelKey =
  | 'action liée'
  | 'document'
  | 'indicateur'
  | 'commentaire'
  | 'sous-mesure'
  | 'historique'
  | 'informations'
  | 'sous-action'
  | 'tâche';

const IRREGULAR_PLURALS: Partial<Record<LabelKey, string>> = {
  'action liée': 'actions liées',
};

const toPlural = (word: LabelKey): string =>
  IRREGULAR_PLURALS[word] ?? `${word}s`;

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** Retourne "N label" avec accord du pluriel français (>= 2 -> pluriel) */
export const pluralize = (count: number, word: LabelKey): string =>
  `${count} ${pluralizeLabel(count, word, { capitalized: false })}`;

/** Retourne le label seul avec accord du pluriel français (>= 2 -> pluriel) */
export const pluralizeLabel = (
  count: number | undefined,
  word: LabelKey,
  { capitalized = true }: { capitalized?: boolean } = {}
): string => {
  const label = count !== undefined && count >= 2 ? toPlural(word) : word;
  return capitalized ? capitalize(label) : label;
};
