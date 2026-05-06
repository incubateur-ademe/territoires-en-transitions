import { ListTagsService } from '@tet/backend/collectivites/tags/list-tags/list-tags.service';
import { MutateTagService } from '@tet/backend/collectivites/tags/mutate-tag/mutate-tag.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Tag, TagType } from '@tet/domain/collectivites';
import { normalizeName } from '../utils/normalize-name.utils';

const buildTagsByNormalizedName = (tags: Tag[]): Map<string, Tag> =>
  tags.reduce((acc, tag) => {
    const key = normalizeName(tag.nom);
    if (!acc.has(key)) {
      acc.set(key, tag);
    }
    return acc;
  }, new Map<string, Tag>());

export async function createTagResolver(
  collectiviteId: number,
  listTagsService: ListTagsService,
  mutateTagService: MutateTagService,
  tagType: TagType,
  user: AuthenticatedUser,
  tx: Transaction
): Promise<{
  getOrCreate: (name: string) => Promise<Result<Tag, string>>;
}> {
  const tagsResult = await listTagsService.listTags(
    { collectiviteId, tagType },
    { tx }
  );

  if (!tagsResult.success) {
    throw new Error(tagsResult.error);
  }

  const tagsByNormalizedName = buildTagsByNormalizedName(tagsResult.data);

  const createTag = async (name: string): Promise<Result<Tag, string>> =>
    mutateTagService.createTag(
      { nom: name, collectiviteId, tagType },
      { user, isUserTrusted: true, tx }
    );

  const getOrCreate = async (name: string): Promise<Result<Tag, string>> => {
    const key = normalizeName(name);

    const existing = tagsByNormalizedName.get(key);
    if (existing) {
      return success(existing);
    }

    const created = await createTag(name);
    if (!created.success) {
      return failure(created.error);
    }

    const newTag = { ...created.data, collectiviteId };
    tagsByNormalizedName.set(key, newTag);

    return success(created.data);
  };

  return { getOrCreate };
}
