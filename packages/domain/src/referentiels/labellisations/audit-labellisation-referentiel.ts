import { ReferentielId } from '../referentiel-id.enum';

export type AuditLabellisationReferentielId = Extract<
  ReferentielId,
  'cae' | 'eci'
>;

export const isAuditLabellisationReferentiel = (
  referentielId: ReferentielId
): referentielId is AuditLabellisationReferentielId =>
  referentielId === 'cae' || referentielId === 'eci';
