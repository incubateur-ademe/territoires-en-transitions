import { SujetDemande, SujetDemandeEnum } from '@tet/domain/referentiels';

export type AuditTypeOption = {
  sujet: SujetDemande;
  disabled: boolean;
};

export const availableAuditTypes = ({
  labellisable,
  canTargetAuditStar,
}: {
  labellisable: boolean;
  canTargetAuditStar: boolean;
}): AuditTypeOption[] => {
  const labellisationDisabled = !labellisable || !canTargetAuditStar;

  return [
    { sujet: SujetDemandeEnum.COT, disabled: false },
    { sujet: SujetDemandeEnum.LABELLISATION_COT, disabled: labellisationDisabled },
    { sujet: SujetDemandeEnum.LABELLISATION, disabled: labellisationDisabled },
  ];
};
