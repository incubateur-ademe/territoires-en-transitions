import type { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';

/**
 * Erreur commune aux soumissions qui figent les classeurs du dossier
 * (transmission pour avis, publication). Chacune la reprend dans son propre
 * enum, comme les erreurs de transition.
 */
export const demarchePcaetExportErrors = ['EXPORT_GENERATION_ERROR'] as const;

export type DemarchePcaetExportError =
  (typeof demarchePcaetExportErrors)[number];

export const DemarchePcaetExportErrorEnum = {
  EXPORT_GENERATION_ERROR: 'EXPORT_GENERATION_ERROR',
} as const satisfies Record<DemarchePcaetExportError, DemarchePcaetExportError>;

/**
 * Les classeurs du dossier n'ont pas pu être figés : rien n'est soumis, la
 * collectivité réessaie. Le libellé vient du catalogue de l'app, qui reçoit ce
 * code dans `data.errorKey`.
 */
export const demarchePcaetExportErrorConfig: NonNullable<
  TrpcErrorHandlerConfig<DemarchePcaetExportError>['specificErrors']
> = {
  EXPORT_GENERATION_ERROR: { code: 'INTERNAL_SERVER_ERROR' },
};
