import { ListMembresService } from '@tet/backend/collectivites/membres/list-membres/list-membres.service';
import { ListTagsService } from '@tet/backend/collectivites/tags/list-tags/list-tags.service';
import { MutateTagService } from '@tet/backend/collectivites/tags/mutate-tag/mutate-tag.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { getFuse } from '@tet/backend/utils/fuse/fuse.utils';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import { Tag, TagEnum } from '@tet/domain/collectivites';

type CreateTagFn = (
  name: string,
  collectiviteId: number,
  user: AuthenticatedUser,
  tx: Transaction
) => Promise<Result<Tag, string>>;

export const createPersonneResolver = async (
  collectiviteId: number,
  listMembresService: ListMembresService,
  listTagsService: ListTagsService,
  mutateTagService: MutateTagService,
  user: AuthenticatedUser,
  tx?: Transaction
) => {
  const Fuse = await getFuse();
  const [members, tagsResult] = await Promise.all([
    listMembresService.list({ collectiviteId }, { tx }),
    listTagsService.listTags(
      { collectiviteId, tagType: TagEnum.Personne },
      { tx }
    ),
  ]);
  const searchMembers = new Fuse(members.membres, {
    keys: [
      { name: 'nom', weight: 0.7 },
      { name: 'prenom', weight: 0.3 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
  });

  if (!tagsResult.success) {
    throw new Error(tagsResult.error);
  }

  const tags = tagsResult.data;

  const searchTags = new Fuse(tags, {
    keys: ['nom'],
    threshold: 0.3,
    ignoreLocation: true,
  });

  const createTag: CreateTagFn = async (name, collectiviteId, user, tx) => {
    return mutateTagService.createTag(
      { nom: name, collectiviteId, tagType: TagEnum.Personne },
      { user, isUserTrusted: true, tx }
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

    const created = await createTag(name, collectiviteId, user, tx);
    if (!created.success) {
      return failure(created.error);
    }

    // Add the newly created tag to the local collection and update the Fuse index
    const newTag = { ...created.data, collectiviteId };
    tags.push(newTag);
    searchTags.setCollection(tags);

    return success({ tagId: created.data.id });
  };

  return { getOrCreatePersonne };
};
