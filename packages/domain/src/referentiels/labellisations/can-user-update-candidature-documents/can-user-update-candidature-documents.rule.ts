import { PreuveType } from '../../../collectivites/documents/preuve-type.enum.schema';
import { canModifyCandidatureDocuments } from '../can-modify-candidature-documents/can-modify-candidature-documents.rule';
import { LabellisationAudit } from '../labellisation-audit.schema';

export const canUserUpdateCandidatureDocuments = ({
  preuveType,
  canMutateReferentiels,
  canMutateLabellisationDocuments,
  audit,
}: {
  preuveType: PreuveType;
  canMutateReferentiels: boolean;
  canMutateLabellisationDocuments: boolean;
  audit: Pick<LabellisationAudit, 'valide'> | null;
}): boolean => {
  if (preuveType !== 'labellisation') {
    return false;
  }

  const canWriteDocuments =
    canMutateReferentiels || canMutateLabellisationDocuments;
  if (!canWriteDocuments) {
    return false;
  }

  return canModifyCandidatureDocuments({
    audit,
    canMutateLabellisationDocuments,
  });
};
