import { TagService } from '@tet/backend/collectivites/tags/tag.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { getFuse } from '@tet/backend/utils/fuse/fuse.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Tag, TagType } from '@tet/domain/collectivites';

/**
 * Fuse search keys configuration
 * Can be a simple string or an object with name and weight
 */
export type FuseKey = string | { name: string; weight: number };

/**
 * Generic Tag Resolver Factory
 *
 * Creates a resolver for any tag type (Financeur, Partenaire, Service, Structure).
 *
 * This factory eliminates duplication across all tag-based resolvers by providing
 * a generic implementation of the "find or create" pattern with fuzzy search.
 *
 * @param collectiviteId - The collectivité ID
 * @param tagService - The tag service
 * @param tagType - The type of tag to resolve
 * @param searchKeys - The keys to use for fuzzy search (defaults to ['nom'])
 * @returns An object with a getOrCreate function
 *
 * @example
 * ```typescript
 * // Simple key
 * const { getOrCreate } = await createTagResolver(
 *   collectiviteId,
 *   tagService,
 *   TagEnum.Financeur,
 *   ['nom']
 * );
 *
 * // Keys with weights
 * const { getOrCreate } = await createTagResolver(
 *   collectiviteId,
 *   tagService,
 *   TagEnum.Personne,
 *   [
 *     { name: 'nom', weight: 0.7 },
 *     { name: 'prenom', weight: 0.3 }
 *   ]
 * );
 *
 * const result = await getOrCreate('ADEME', tx);
 * // Returns: { success: true, data: 123 }
 * ```
 */
export async function createTagResolver(
  collectiviteId: number,
  tagService: TagService,
  tagType: TagType,
  searchKeys: FuseKey[] = ['nom']
): Promise<{
  getOrCreate: (name: string, tx: Transaction) => Promise<Result<Tag, string>>;
}> {
  const tags = await tagService.getTags(collectiviteId, tagType);

  const Fuse = await getFuse();
  const searchEngine = new Fuse(tags, {
    keys: searchKeys,
    threshold: 0.3,
    ignoreLocation: true,
  });

  const createTag = async (
    name: string,
    tx: Transaction
  ): Promise<Result<Tag, string>> => {
    return tagService.saveTag(
      {
        nom: name,
        collectiviteId,
      },
      tagType,
      tx
    );
  };

  const getOrCreate = async (
    name: string,
    tx: Transaction
  ): Promise<Result<Tag, string>> => {
    const foundTag = searchEngine.search(name)?.[0]?.item;
    if (foundTag) {
      return success(foundTag);
    }

    const created = await createTag(name, tx);
    if (created.success) {
      return success(created.data);
    }

    return failure(created.error);
  };

  return { getOrCreate };
}
