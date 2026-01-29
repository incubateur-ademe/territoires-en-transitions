import { CollectiviteMembresService } from '@tet/backend/collectivites/membres/membres.service';
import { TagService } from '@tet/backend/collectivites/tags/tag.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { getFuse } from '@tet/backend/utils/fuse/fuse.utils';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import { Tag, TagEnum } from '@tet/domain/collectivites';

type CreateTagFn = (
  name: string,
  collectiviteId: number,
  tx: Transaction
) => Promise<Result<Tag, string>>;

export const createPersonneResolver = async (
  collectiviteId: number,
  memberService: CollectiviteMembresService,
  tagService: TagService
) => {
  const Fuse = await getFuse();
  const [members, tags] = await Promise.all([
    memberService.list({ collectiviteId }),
    tagService.getTags(collectiviteId, TagEnum.Personne),
  ]);
  const searchMembers = new Fuse(members, {
    keys: [
      { name: 'nom', weight: 0.7 },
      { name: 'prenom', weight: 0.3 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
  });
  const searchTags = new Fuse(tags, {
    keys: ['nom'],
    threshold: 0.3,
    ignoreLocation: true,
  });

  const createTag: CreateTagFn = async (name, collectiviteId, tx) => {
    return tagService.saveTag(
      {
        nom: name,
        collectiviteId,
      },
      TagEnum.Personne,
      tx
    );
  };

  const getOrCreatePersonne = async (
    name: string,
    tx: Transaction
  ): Promise<
    Result<
      | { userId?: undefined; tagId: number }
      | { userId: string; tagId?: undefined },
      string
    >
  > => {
    const foundPerson = searchMembers.search(name)?.[0]?.item;
    if (foundPerson) {
      return success({ userId: foundPerson.userId });
    }

    const foundTag = searchTags.search(name)?.[0]?.item;
    if (foundTag) {
      return success({ tagId: foundTag.id });
    }

    const created = await createTag(name, collectiviteId, tx);
    if (created.success) {
      return success({ tagId: created.data.id });
    }

    return failure(created.error);
  };
  return { getOrCreatePersonne };
};
