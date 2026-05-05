export const allSectionKeys = [
  'intro',
  'acteurs',
  'indicateurs',
  'notes',
  'moyens',
  'fiches',
  'actionsLiees',
  'documents',
] as const;

export type PdfSectionKey = (typeof allSectionKeys)[number];
