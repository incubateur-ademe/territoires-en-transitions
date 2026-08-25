import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import {
  ActionId,
  isAuditLabellisationReferentiel,
  ReferentielId,
  ReferentRolesDefined,
  ROLE_IDENTIFIANTS,
} from '@tet/domain/referentiels';
import { useMemo } from 'react';

const roleActionIds = (referentielId: ReferentielId): ActionId[] => {
  if (!isAuditLabellisationReferentiel(referentielId)) {
    return [];
  }
  const { eluReferent, referentTechnique } = ROLE_IDENTIFIANTS[referentielId];
  return [
    `${referentielId}_${eluReferent}`,
    `${referentielId}_${referentTechnique}`,
  ];
};

export const useReferentRolesDefined = (
  referentielId: ReferentielId
): { referentRolesDefined: ReferentRolesDefined; isLoaded: boolean } => {
  const actionIds = roleActionIds(referentielId);
  const [eluReferentActionId, referentTechniqueActionId] = actionIds;

  const { data, isPending } = useListActions({ actionIds });

  const hasPilotes = (actionId: ActionId | undefined): boolean =>
    actionId !== undefined &&
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
