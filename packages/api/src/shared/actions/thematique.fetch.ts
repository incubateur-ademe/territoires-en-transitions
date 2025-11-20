import { Thematique } from '@tet/domain/shared';
import { DBClient } from '../../typeUtils';

/**
 * Recupère les thématiques
 * @param dbClient client supabase
 * @return liste de thématiques
 */
export async function selectThematiques(
  dbClient: DBClient
): Promise<Thematique[]> {
  const { data } = await dbClient.from('thematique').select('id, nom');

  return data ? (data as Thematique[]) : [];
}
