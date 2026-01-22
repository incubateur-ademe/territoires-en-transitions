import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { useParams } from 'next/navigation';

export function useGetDefaultEventProperties() {
  const params = useParams();

  let collectiviteId: number | undefined;
  let role: CollectiviteRole | null | undefined;
  let isRoleAuditeur: 'auditeur' | null | undefined;

  try {
    const collectivite = useCurrentCollectivite();
    collectiviteId = collectivite.collectiviteId;
    role = collectivite.role;
    isRoleAuditeur = collectivite.isRoleAuditeur ? 'auditeur' : undefined;
  } catch {
    // Fail silently
  }

  const defaultProperties = {
    ...params,
    ...(collectiviteId !== undefined && { collectiviteId }),
    ...(role !== undefined && { niveauAcces: role }),
    ...(isRoleAuditeur !== undefined && { role: isRoleAuditeur }),
  };

  return defaultProperties;
}
