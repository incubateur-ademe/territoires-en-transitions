import { PreuveType } from '../../../collectivites/documents/preuve-type.enum.schema';
import { canModifyCandidatureDocuments } from '../can-modify-candidature-documents/can-modify-candidature-documents.rule';
import { LabellisationAudit } from '../labellisation-audit.schema';

export const canUserUpdateCandidatureDocuments = ({
  preuveType,
  canMutateReferentiels,
  audit,
}: {
  preuveType: PreuveType;
  canMutateReferentiels: boolean;
  audit: Pick<LabellisationAudit, 'valide'> | null;
}): boolean => {
  if (preuveType !== 'labellisation') {
    return false;
  }
  if (!canMutateReferentiels) {
    return false;
  }
  return canModifyCandidatureDocuments({ audit });
};
