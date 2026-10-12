import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

const actionsDeReferenceSpecificErrors = [
  'ACTION_DE_REFERENCE_NOT_FOUND',
  'ACTION_DE_REFERENCE_CONFLICT',
  'FICHE_NOT_FOUND',
  'FICHE_IS_SOUS_ACTION',
] as const;

export type ActionsDeReferenceSpecificError =
  (typeof actionsDeReferenceSpecificErrors)[number];

export const ActionsDeReferenceErrorEnum = createErrorsEnum(
  actionsDeReferenceSpecificErrors
);

type ActionsDeReferenceError = keyof typeof ActionsDeReferenceErrorEnum;

export type ListActionsDeReferenceError = Extract<
  ActionsDeReferenceError,
  'DATABASE_ERROR'
>;

export type GetActionDeReferenceError = Extract<
  ActionsDeReferenceError,
  'ACTION_DE_REFERENCE_NOT_FOUND' | 'DATABASE_ERROR'
>;

export type ListFicheIdsActionDeReferenceError = Extract<
  ActionsDeReferenceError,
  'DATABASE_ERROR'
>;

export type ListFichesActionDeReferenceError = Extract<
  ActionsDeReferenceError,
  'ACTION_DE_REFERENCE_NOT_FOUND' | 'DATABASE_ERROR'
>;

export type ListFicheParentsError = Extract<
  ActionsDeReferenceError,
  'DATABASE_ERROR'
>;

export type ReplaceFichesError = Extract<
  ActionsDeReferenceError,
  'DATABASE_ERROR'
>;

export type LinkableFicheIdsError = Extract<
  ActionsDeReferenceError,
  'FICHE_NOT_FOUND' | 'FICHE_IS_SOUS_ACTION'
>;

export type UpdateActionDeReferenceRepositoryError = Extract<
  ActionsDeReferenceError,
  | 'ACTION_DE_REFERENCE_NOT_FOUND'
  | 'ACTION_DE_REFERENCE_CONFLICT'
  | 'DATABASE_ERROR'
>;

export type UpdateActionDeReferenceError = Extract<
  ActionsDeReferenceError,
  | UpdateActionDeReferenceRepositoryError
  | ReplaceFichesError
  | LinkableFicheIdsError
  | 'UNAUTHORIZED'
>;
