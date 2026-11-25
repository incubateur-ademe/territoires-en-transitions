import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['FICHE_NOT_FOUND', 'USER_ID_REQUIRED'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listFichesErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  commonErrors: {
    // La cause est le ForbiddenException du contrôle de lecture de la fiche :
    // son message était déjà renvoyé à l'appelant avant le passage au Result.
    UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
  },
  specificErrors: {
    // La cause donne l'id de la fiche introuvable.
    FICHE_NOT_FOUND: { code: 'NOT_FOUND', messageFromCause: true },
    USER_ID_REQUIRED: {
      code: 'BAD_REQUEST',
      message: 'Seulement supporté pour les utilisateurs authentifiés',
    },
  },
};

export const ListFichesErrorEnum = createErrorsEnum(specificErrors);
export type ListFichesError = keyof typeof ListFichesErrorEnum;

export type ListFichesQueryError = Extract<ListFichesError, 'DATABASE_ERROR'>;

export type CountPiloteFichesError = Extract<
  ListFichesError,
  'USER_ID_REQUIRED' | 'DATABASE_ERROR'
>;

export type GetFicheByIdError = Extract<
  ListFichesError,
  'FICHE_NOT_FOUND' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'DATABASE_ERROR'
>;
