import { ReferentielId } from '../../referentiel-id.enum';
import { ActionId } from '../../actions/action-definition.schema';
import {
  getIdentifiantFromActionId,
  toActionId,
} from '../../referentiel.utils';
import {
  AuditLabellisationReferentielId,
  isAuditLabellisationReferentiel,
} from '../audit-labellisation-referentiel';

export type RoleKey = 'eluReferent' | 'referentTechnique';

export type ReferentRolesDefined = Record<RoleKey, boolean>;

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

export const isReferentRoleDefined = (
  critere: { actionId: string },
  referentiel: ReferentielId,
  referentRolesDefined: ReferentRolesDefined
): boolean => {
  if (!isAuditLabellisationReferentiel(referentiel)) {
    return true;
  }
  const identifiant = getIdentifiantFromActionId(critere.actionId);
  const roleKey =
    identifiant !== null
      ? roleKeyByIdentifiant(referentiel).get(identifiant)
      : undefined;
  return roleKey === undefined || referentRolesDefined[roleKey];
};

export const areAllReferentRolesDefined = (
  criteres: readonly { actionId: string }[],
  referentiel: ReferentielId,
  referentRolesDefined: ReferentRolesDefined
): boolean =>
  criteres.every((critere) =>
    isReferentRoleDefined(critere, referentiel, referentRolesDefined)
  );

export const getRoleMesureIds = (referentiel: ReferentielId): ActionId[] => {
  if (!isAuditLabellisationReferentiel(referentiel)) {
    return [];
  }
  const mapping = ROLE_IDENTIFIANTS[referentiel];
  return [mapping.eluReferent, mapping.referentTechnique].map((identifiant) =>
    toActionId(referentiel, identifiant)
  );
};

export const toReferentRolesDefined = ({
  referentiel,
  mesureIdsWithPilotes,
}: {
  referentiel: ReferentielId;
  mesureIdsWithPilotes: readonly string[];
}): ReferentRolesDefined => {
  if (!isAuditLabellisationReferentiel(referentiel)) {
    return { eluReferent: false, referentTechnique: false };
  }
  const mapping = ROLE_IDENTIFIANTS[referentiel];

  return {
    eluReferent: mesureIdsWithPilotes.includes(
      toActionId(referentiel, mapping.eluReferent)
    ),
    referentTechnique: mesureIdsWithPilotes.includes(
      toActionId(referentiel, mapping.referentTechnique)
    ),
  };
};
