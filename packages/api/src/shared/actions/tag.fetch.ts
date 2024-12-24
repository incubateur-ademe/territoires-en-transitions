import { Tag, TagType } from '@/domain/collectivites';
import { objectToCamel } from 'ts-case-convert';
import { DBClient } from '../../typeUtils';

/**
 * Récupère les tags d'une collectivité
 * @param dbClient client supabase
 * @param collectiviteId identifiant de la collectivité
 * @param tagType type de tag
 * @return liste de tags
 */
export async function selectTags(
  dbClient: DBClient,
  collectiviteId: number,
  tagType: TagType
): Promise<Tag[]> {
  const { data } = await dbClient
    .from(`${tagType}_tag` as const)
    .select('id, nom, collectivite_id')
    .eq('collectivite_id', collectiviteId);

  return data ? (objectToCamel(data) as Tag[]) : [];
}
