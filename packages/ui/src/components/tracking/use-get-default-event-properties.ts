import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { useParams } from 'next/navigation';

export function useGetDefaultEventProperties() {
  const params = useParams();

  let collectiviteId: number | undefined;
  let niveauAcces: CollectiviteRole | null | undefined;
  let role: 'auditeur' | null | undefined;

  try {
    const collectivite = useCurrentCollectivite();
    collectiviteId = collectivite.collectiviteId;
    niveauAcces = collectivite.niveauAcces;
    role = collectivite.isRoleAuditeur ? 'auditeur' : undefined;
  } catch {
    // Fail silently
  }

  const defaultProperties = {
    ...params,
    ...(collectiviteId !== undefined && { collectiviteId }),
    ...(niveauAcces !== undefined && { niveauAcces }),
    ...(role !== undefined && { role }),
  };

  return defaultProperties;
}
