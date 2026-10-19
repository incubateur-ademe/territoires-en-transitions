export const UploadDecisionKindEnum = {
  ALREADY_IN_BIBLIOTHEQUE: 'alreadyInBibliotheque',
  ALREADY_IN_STORAGE: 'alreadyInStorage',
  READY_TO_UPLOAD: 'readyToUpload',
} as const;

export type UploadDecisionKind =
  (typeof UploadDecisionKindEnum)[keyof typeof UploadDecisionKindEnum];
