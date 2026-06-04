import { AuditLabellisationReferentielId } from '../audit-labellisation-referentiel';

export type RoleKey = 'eluReferent' | 'referentTechnique';

export const ROLE_IDENTIFIANTS: Record<
  AuditLabellisationReferentielId,
  Record<RoleKey, string>
> = {
  cae: {
    eluReferent: '5.1.2.1.1',
    referentTechnique: '5.1.1.1.3',
  },
  eci: {
    eluReferent: '1.1.1.1',
    referentTechnique: '1.1.1.3',
  },
};

export const roleKeyByIdentifiant = (
  referentiel: AuditLabellisationReferentielId
): ReadonlyMap<string, RoleKey> => {
  const mapping = ROLE_IDENTIFIANTS[referentiel];
  return new Map<string, RoleKey>([
    [mapping.eluReferent, 'eluReferent'],
    [mapping.referentTechnique, 'referentTechnique'],
  ]);
};
