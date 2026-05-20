import { ReferentielId } from '@tet/domain/referentiels';

/** Référentiels couverts par la vue audit-labellisation. */
export type AuditLabellisationReferentielId = Extract<
  ReferentielId,
  'cae' | 'eci'
>;

export const isAuditLabellisationReferentiel = (
  referentielId: ReferentielId
): referentielId is AuditLabellisationReferentielId =>
  referentielId === 'cae' || referentielId === 'eci';
