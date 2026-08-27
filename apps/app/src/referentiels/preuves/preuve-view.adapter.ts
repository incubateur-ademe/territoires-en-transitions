import { TAuditEnCours } from '@/app/referentiels/audits/types';
import { ReferentielId } from '@tet/domain/referentiels';

export type AuditFromView = Omit<TAuditEnCours, 'referentiel_id'> & {
  referentiel: ReferentielId;
};

export const toAuditEnCours = ({
  referentiel,
  ...audit
}: AuditFromView): TAuditEnCours => ({
  ...audit,
  referentiel_id: referentiel,
});
