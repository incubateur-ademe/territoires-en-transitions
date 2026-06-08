import { ReferentielId } from '../../referentiel-id.enum';
import { getIdentifiantFromActionId } from '../../referentiel.utils';
import {
  AuditLabellisationReferentielId,
  isAuditLabellisationReferentiel,
} from '../audit-labellisation-referentiel';

export type RoleKey = 'eluReferent' | 'referentTechnique';

export type RolePilotesPresence = Record<RoleKey, boolean>;

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

export const isRolePilotePresent = (
  critere: { action_id: string },
  referentiel: ReferentielId,
  rolePilotesPresence: RolePilotesPresence
): boolean => {
  if (!isAuditLabellisationReferentiel(referentiel)) {
    return true;
  }
  const identifiant = getIdentifiantFromActionId(critere.action_id);
  const roleKey =
    identifiant !== null
      ? roleKeyByIdentifiant(referentiel).get(identifiant)
      : undefined;
  return roleKey === undefined || rolePilotesPresence[roleKey];
};
