import { DBClient } from '../../typeUtils';
import { Tag, TagInsert, TypeTag } from '../domain/tag.schema';
import { objectToCamel, objectToSnake } from 'ts-case-convert';

/**
 * Ajoute des tags
 * @param dbClient client supabase
 * @param typeTag type de tag
 * @param tags listes des tags à ajouter
 * @return liste de tags ajoutés avec leur identifiant
 */
export async function insertTags(
  dbClient: DBClient,
  typeTag: TypeTag,
  tags: TagInsert[]
): Promise<Tag[]> {
  const { data } = await dbClient
    .from(`${typeTag}_tag` as const)
    .insert(objectToSnake(tags))
    .select();

  return data ? (objectToCamel(data) as Tag[]) : [];
}
