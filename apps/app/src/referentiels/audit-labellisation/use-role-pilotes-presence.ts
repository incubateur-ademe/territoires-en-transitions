import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import {
  ActionId,
  AuditLabellisationReferentielId,
  ROLE_IDENTIFIANTS,
  RolePilotesPresence,
} from '@tet/domain/referentiels';
import { useMemo } from 'react';

const makeRoleActionId = (
  referentielId: AuditLabellisationReferentielId,
  identifiant: string
): ActionId => `${referentielId}_${identifiant}`;

export const useRolePilotesPresence = (
  referentielId: AuditLabellisationReferentielId
): { presence: RolePilotesPresence; isLoaded: boolean } => {
  const mapping = ROLE_IDENTIFIANTS[referentielId];
  const eluReferentActionId = makeRoleActionId(
    referentielId,
    mapping.eluReferent
  );
  const referentTechniqueActionId = makeRoleActionId(
    referentielId,
    mapping.referentTechnique
  );

  const { data, isPending } = useListActions({
    actionIds: [eluReferentActionId, referentTechniqueActionId],
  });

  const hasPilotes = (actionId: ActionId): boolean =>
    (data.find((action) => action.actionId === actionId)?.pilotes?.length ??
      0) > 0;

  const eluReferent = hasPilotes(eluReferentActionId);
  const referentTechnique = hasPilotes(referentTechniqueActionId);

  const presence = useMemo(
    (): RolePilotesPresence => ({ eluReferent, referentTechnique }),
    [eluReferent, referentTechnique]
  );

  return {
    presence,
    isLoaded: !isPending,
  };
};
