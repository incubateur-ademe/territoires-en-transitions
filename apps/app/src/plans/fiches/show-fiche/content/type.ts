const FICHE_SECTIONS = [
  'details',
  'indicateurs',
  'sous-actions',
  'notes',
  'moyens',
  'actions-liees',
  'mesures-liees',
  'documents',
  'services',
] as const;
export type FicheSectionId = (typeof FICHE_SECTIONS)[number];

export const isFicheSectionId = (id: string): id is FicheSectionId => {
  return FICHE_SECTIONS.includes(id as FicheSectionId);
};
