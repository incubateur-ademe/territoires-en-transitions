import { TSupabaseClient } from './getSupabaseClient.ts';
import { Enums } from './typeUtils.ts';

type Collectivite = {
  collectivite_id: number;
  nom: string;
  niveau_acces: Enums<'niveau_acces'> | null;
  acces_restreint: boolean;
  est_auditeur: boolean;
  // états dérivés
  isAdmin: boolean;
  readonly: boolean;
};

/**
 * Charge les infos de la collectivité
 */
export const fetchCollectivite = async (
  supabaseClient: TSupabaseClient,
  collectivite_id: number
) => {
  const { data, error } = await supabaseClient
    .from('collectivite_niveau_acces')
    .select()
    .match({ collectivite_id });

  if (error) {
    throw new Error(error.message);
  }

  const collectivite = data![0];
  if (!collectivite) return null;

  const { nom, niveau_acces, est_auditeur, access_restreint } = collectivite;

  return collectivite
    ? ({
        collectivite_id,
        nom,
        niveau_acces,
        isAdmin: niveau_acces === 'admin',
        est_auditeur,
        acces_restreint: access_restreint || false,
        readonly: niveau_acces === null || niveau_acces === 'lecture',
      } as Collectivite)
    : null;
};
