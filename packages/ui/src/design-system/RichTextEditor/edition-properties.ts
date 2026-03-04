export const allFormattingActions = [
  'bold',
  'italic',
  'underline',
  'color',
  'link',
  'blockType',
] as const;
export type FormattingAction = (typeof allFormattingActions)[number];

export const allSuggestionItems = [
  'numbered_list',
  'bullet_list',
  'paragraph',
  'emoji',
] as const;
export type SuggestionItem = (typeof allSuggestionItems)[number];
