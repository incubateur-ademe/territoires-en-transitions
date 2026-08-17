import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import type {
  ApplyTransitionResult,
  DemarchePcaetGuardId,
} from '@tet/domain/demarches';

/**
 * Erreurs communes aux six opérations de transition. Chacune les reprend dans
 * son propre enum : le contrat d'erreur reste lisible route par route.
 */
export const demarchePcaetTransitionErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'TRANSITION_NOT_ALLOWED',
  'NON_PILOTE',
  'DOSSIER_INCOMPLET',
  'DELAI_AVIS_NON_ECOULE',
  'EVALUATION_FINALE_MANQUANTE',
  'DOCUMENTS_AVAL_INCOMPLETS',
] as const;

export type DemarchePcaetTransitionError =
  (typeof demarchePcaetTransitionErrors)[number];

/**
 * Le code HTTP de chaque cause, et rien de plus : le libellé affiché est celui
 * du catalogue de l'app, qui reçoit ce code dans `data.errorKey`.
 */
export const demarchePcaetTransitionErrorConfig: TrpcErrorHandlerConfig<DemarchePcaetTransitionError>['specificErrors'] =
  {
    DEMARCHE_PCAET_NOT_FOUND: { code: 'NOT_FOUND' },
    // La transition ne part pas du statut courant : un conflit d'état, pas une
    // condition non remplie.
    TRANSITION_NOT_ALLOWED: { code: 'CONFLICT' },
    NON_PILOTE: { code: 'FORBIDDEN' },
    DOSSIER_INCOMPLET: { code: 'PRECONDITION_FAILED' },
    DELAI_AVIS_NON_ECOULE: { code: 'PRECONDITION_FAILED' },
    EVALUATION_FINALE_MANQUANTE: { code: 'PRECONDITION_FAILED' },
    DOCUMENTS_AVAL_INCOMPLETS: { code: 'PRECONDITION_FAILED' },
  };

export const DemarchePcaetTransitionErrorEnum = createErrorsEnum(
  demarchePcaetTransitionErrors
);

/** Un refus, une cause : chaque guard porte le message qui l'explique. */
const GUARD_ERRORS = {
  estPilote: 'NON_PILOTE',
  dossierComplet: 'DOSSIER_INCOMPLET',
  delaiAvisEcoule: 'DELAI_AVIS_NON_ECOULE',
  evaluationFinaleDeposee: 'EVALUATION_FINALE_MANQUANTE',
  documentsAvalComplets: 'DOCUMENTS_AVAL_INCOMPLETS',
} as const satisfies Record<DemarchePcaetGuardId, DemarchePcaetTransitionError>;

/**
 * Traduit le refus du workflow en code d'erreur. L'ordre des guards dans la
 * définition de la transition fixe la priorité du message : « vous n'êtes pas
 * pilote » passe avant « le dossier est incomplet ».
 */
export const toDemarchePcaetTransitionError = (
  result: Extract<ApplyTransitionResult, { success: false }>
): DemarchePcaetTransitionError | 'SERVER_ERROR' => {
  if (result.error === 'TRANSITION_NOT_ALLOWED') {
    return 'TRANSITION_NOT_ALLOWED';
  }
  const [firstBlocking] = result.blockedBy;
  return firstBlocking ? GUARD_ERRORS[firstBlocking] : 'SERVER_ERROR';
};
