import { SujetDemande, SujetDemandeEnum } from '../labellisation-demande.schema';

type AuditTypeAccessibility = {
  sujet: SujetDemande;
  isAccessible: (context: {
    isCOT: boolean;
    canRequestLabellisation: boolean;
  }) => boolean;
};

const AUDIT_TYPES: readonly AuditTypeAccessibility[] = [
  {
    sujet: SujetDemandeEnum.COT,
    isAccessible: ({ isCOT, canRequestLabellisation }) =>
      isCOT && canRequestLabellisation,
  },
  {
    sujet: SujetDemandeEnum.LABELLISATION_COT,
    isAccessible: ({ isCOT, canRequestLabellisation }) =>
      isCOT && canRequestLabellisation,
  },
  {
    sujet: SujetDemandeEnum.LABELLISATION,
    isAccessible: ({ canRequestLabellisation }) => canRequestLabellisation,
  },
];

export const availableAuditTypes = (context: {
  isCOT: boolean;
  canRequestLabellisation: boolean;
}): SujetDemande[] =>
  AUDIT_TYPES.filter((auditType) => auditType.isAccessible(context)).map(
    (auditType) => auditType.sujet
  );
