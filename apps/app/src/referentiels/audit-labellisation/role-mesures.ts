import { AuditLabellisationReferentielId } from './referentiel';

export type RoleKey = 'equipeProjet' | 'eluReferent' | 'referentTechnique';

export const ROLE_IDENTIFIANTS: Record<
  AuditLabellisationReferentielId,
  Record<RoleKey, string>
> = {
  cae: {
    equipeProjet: '5.1.1.3.2',
    eluReferent: '5.1.2.1.1',
    referentTechnique: '5.1.1.1.3',
  },
  eci: {
    equipeProjet: '1.1.3.1',
    eluReferent: '1.1.1.1',
    referentTechnique: '1.1.1.3',
  },
};
