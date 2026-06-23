import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import {
  ActionId,
  AuditLabellisationReferentielId,
  ReferentRolesDefined,
  ROLE_IDENTIFIANTS,
} from '@tet/domain/referentiels';
import { useMemo } from 'react';

const makeRoleActionId = (
  referentielId: AuditLabellisationReferentielId,
  identifiant: string
): ActionId => `${referentielId}_${identifiant}`;

export const useReferentRolesDefined = (
  referentielId: AuditLabellisationReferentielId
): { referentRolesDefined: ReferentRolesDefined; isLoaded: boolean } => {
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

  const referentRolesDefined = useMemo(
    (): ReferentRolesDefined => ({ eluReferent, referentTechnique }),
    [eluReferent, referentTechnique]
  );

  return {
    referentRolesDefined,
    isLoaded: !isPending,
  };
};
