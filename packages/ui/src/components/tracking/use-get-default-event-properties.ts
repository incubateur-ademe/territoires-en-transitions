import { useCurrentCollectivite } from '@tet/api/collectivites';
import { CollectiviteAccessLevel } from '@tet/domain/users';
import { useParams } from 'next/navigation';

export function useGetDefaultEventProperties() {
  const params = useParams();

  let collectiviteId: number | undefined;
  let niveauAcces: CollectiviteAccessLevel | null | undefined;
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
