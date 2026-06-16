import { TPreuveAuditEtLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ParcoursLabellisationStatus } from '@tet/domain/referentiels';

export const canModifyAuditOrLabellisationPreuve = ({
  preuveType,
  status,
  isAuditeur,
  canMutateReferentiels,
}: {
  preuveType: TPreuveAuditEtLabellisation['preuve_type'];
  status: ParcoursLabellisationStatus;
  isAuditeur: boolean;
  canMutateReferentiels: boolean;
}): boolean => {
  const isRapportAudit = preuveType === 'audit';

  if (isAuditeur && isRapportAudit) {
    return true;
  }
  if (!canMutateReferentiels) {
    return false;
  }
  if (status === 'audit_valide') {
    return false;
  }
  return !(isRapportAudit && status === 'audit_en_cours');
};
