export const UpdateFicheErrorType = {
  SELF_REFERENCE: 'SELF_REFERENCE',
  PARENT_NOT_FOUND: 'PARENT_NOT_FOUND',
  FICHE_NOT_FOUND: 'FICHE_NOT_FOUND',
} as const;

export type UpdateFicheErrorType =
  (typeof UpdateFicheErrorType)[keyof typeof UpdateFicheErrorType];

export type UpdateFicheError = UpdateFicheErrorType;
