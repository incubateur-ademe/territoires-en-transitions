import { DBClient } from '@/api';

// charge une collectivité
export const fetchCurrentCollectivite = async (
  supabase: DBClient,
  collectiviteId: number
) => {
  const { data } = await supabase
    .from('collectivite_niveau_acces')
    .select()
    .match({ collectivite_id: collectiviteId });

  if (!data || data.length === 0) {
    throw new Error(`Collectivité ${collectiviteId} non trouvée`);
  }

  const [collectivite] = data;

  return {
    collectiviteId,
    nom: collectivite.nom || '',
    niveauAcces: collectivite.niveau_acces,
    isRoleAuditeur: collectivite.est_auditeur || false,
    role: collectivite.est_auditeur ? ('auditeur' as const) : null,
    accesRestreint: collectivite.access_restreint || false,
    isReadOnly:
      (collectivite.niveau_acces === null ||
        collectivite.niveau_acces === 'lecture') &&
      !collectivite.est_auditeur,
  };
};
