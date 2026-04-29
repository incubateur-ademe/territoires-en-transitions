import { ListMembresService } from '@tet/backend/collectivites/membres/list-membres/list-membres.service';
import { ListTagsService } from '@tet/backend/collectivites/tags/list-tags/list-tags.service';
import { MutateTagService } from '@tet/backend/collectivites/tags/mutate-tag/mutate-tag.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import { Membre, Tag, TagEnum } from '@tet/domain/collectivites';
import { normalizeName } from '../utils/normalize-name.utils';

type CreateTagFn = (
  name: string,
  collectiviteId: number,
  user: AuthenticatedUser
) => Promise<Result<Tag, string>>;

export type PersonneResolution =
  | { userId: string; tagId?: undefined }
  | { userId?: undefined; tagId: number };

const buildMembersByNormalizedName = (
  membres: Membre[]
): Map<string, Membre[]> => {
  const buckets = membres.reduce((acc, membre) => {
    const keys = [
      normalizeName(`${membre.prenom} ${membre.nom}`),
      normalizeName(`${membre.nom} ${membre.prenom}`),
    ];
    keys.forEach((key) => {
      const bucket = acc.get(key) ?? new Map<string, Membre>();
      bucket.set(membre.userId, membre);
      acc.set(key, bucket);
    });
    return acc;
  }, new Map<string, Map<string, Membre>>());

  return new Map(
    Array.from(buckets, ([key, bucket]) => [key, Array.from(bucket.values())])
  );
};

const buildTagIdsByNormalizedName = (tags: Tag[]): Map<string, number> =>
  tags.reduce((acc, tag) => {
    const key = normalizeName(tag.nom);
    if (!acc.has(key)) {
      acc.set(key, tag.id);
    }
    return acc;
  }, new Map<string, number>());

export const createPersonneResolver = async (
  collectiviteId: number,
  listMembresService: ListMembresService,
  listTagsService: ListTagsService,
  mutateTagService: MutateTagService,
  user: AuthenticatedUser,
  tx: Transaction
): Promise<{
  getOrCreatePersonne: (
    name: string
  ) => Promise<Result<PersonneResolution, string>>;
}> => {
  const [membresResult, tagsResult] = await Promise.all([
    listMembresService.list({ collectiviteId }, { tx }),
    listTagsService.listTags(
      { collectiviteId, tagType: TagEnum.Personne },
      { tx }
    ),
  ]);

  if (!tagsResult.success) {
    throw new Error(tagsResult.error);
  }

  const membresByNormalizedName = buildMembersByNormalizedName(
    membresResult.membres
  );
  const tagIdsByNormalizedName = buildTagIdsByNormalizedName(tagsResult.data);

  const createTag: CreateTagFn = async (name, collectiviteId, user) =>
    mutateTagService.createTag(
      { nom: name, collectiviteId, tagType: TagEnum.Personne },
      { user, isUserTrusted: true, tx }
    );

  const getOrCreatePersonne = async (
    name: string
  ): Promise<Result<PersonneResolution, string>> => {
    const key = normalizeName(name);

    const matchingMembres = membresByNormalizedName.get(key) ?? [];
    if (matchingMembres.length === 1) {
      return success({ userId: matchingMembres[0].userId });
    }
    if (matchingMembres.length > 1) {
      const emails = matchingMembres.map((m) => m.email).join(', ');
      return failure(
        `Plusieurs membres correspondent à "${name}" (${emails}). Utilisez un libellé qui désambiguïse (par exemple en ajoutant le second prénom) ou modifiez le compte.`
      );
    }

    const existingTagId = tagIdsByNormalizedName.get(key);
    if (existingTagId !== undefined) {
      return success({ tagId: existingTagId });
    }

    const created = await createTag(name, collectiviteId, user);
    if (!created.success) {
      return failure(created.error);
    }

    tagIdsByNormalizedName.set(key, created.data.id);

    return success({ tagId: created.data.id });
  };

  return { getOrCreatePersonne };
};
