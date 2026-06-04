export const canUploadLabellisationDocument = ({
  canMutateReferentiels,
  isAuditeur,
}: {
  canMutateReferentiels: boolean;
  isAuditeur: boolean;
}): boolean => canMutateReferentiels && !isAuditeur;
