import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

const actionsDeReferenceSpecificErrors = [
  'ACTION_DE_REFERENCE_NOT_FOUND',
  'ACTION_DE_REFERENCE_CONFLICT',
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

export type UpdateActionDeReferenceRepositoryError = Extract<
  ActionsDeReferenceError,
  ActionsDeReferenceSpecificError | 'DATABASE_ERROR'
>;

export type UpdateActionDeReferenceError = Extract<
  ActionsDeReferenceError,
  UpdateActionDeReferenceRepositoryError | 'UNAUTHORIZED'
>;
