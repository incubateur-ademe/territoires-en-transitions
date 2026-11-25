export const allSectionKeys = [
  'intro',
  'acteurs',
  'indicateurs',
  'sousActions',
  'notes',
  'moyens',
  'fiches',
  'actionsLiees',
  'documents',
] as const;

export type PdfSectionKey = (typeof allSectionKeys)[number];
