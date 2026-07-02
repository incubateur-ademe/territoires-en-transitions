import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { canUpdateActionStatutRulesErrors } from '@tet/domain/referentiels';

const specificErrors = [
  'NO_ACTION_STATUTS',
  'DUPLICATE_ACTION',
  'MIXED_REFERENTIEL_ACTIONS',
  'MIXED_COLLECTIVITE_ACTIONS',
  'ACTION_NOT_FOUND',
  'ACTION_NOT_IN_SNAPSHOT',
  ...canUpdateActionStatutRulesErrors,
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateActionStatutErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      NO_ACTION_STATUTS: {
        code: 'BAD_REQUEST',
        message: 'Aucun statut à mettre à jour.',
      },
      DUPLICATE_ACTION: {
        code: 'BAD_REQUEST',
        message: 'Une action est en double dans la requête.',
      },
      MIXED_REFERENTIEL_ACTIONS: {
        code: 'BAD_REQUEST',
        message:
          'Les actions ne sont pas toutes dans le même référentiel.',
      },
      MIXED_COLLECTIVITE_ACTIONS: {
        code: 'BAD_REQUEST',
        message:
          'Les actions ne sont pas toutes dans la même collectivité.',
      },
      ACTION_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'action demandée n'existe pas pour ce référentiel.",
      },
      ACTION_NOT_IN_SNAPSHOT: {
        code: 'BAD_REQUEST',
        message: "L'action n'existe pas dans le snapshot courant.",
      },
      ACTION_DISABLED: {
        code: 'BAD_REQUEST',
        message: "L'action est désactivée et ne peut pas être modifiée.",
      },
      AUDIT_STARTED_BUT_NOT_AUDITEUR: {
        code: 'BAD_REQUEST',
        message:
          "Un audit est en cours : seuls les auditeurs peuvent modifier les statuts.",
      },
      AUDIT_VALIDATED: {
        code: 'BAD_REQUEST',
        message:
          "L'audit est validé : les statuts ne peuvent plus être modifiés.",
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const UpdateActionStatutErrorEnum = createErrorsEnum(specificErrors);
export type UpdateActionStatutError = keyof typeof UpdateActionStatutErrorEnum;
