import { InstanceGouvernanceService } from '@tet/backend/collectivites/handle-instance-gouvernance/handle-instance-gouvernance.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { getFuse } from '@tet/backend/utils/fuse/fuse.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { Tag } from '@tet/domain/collectivites';

export const createInstanceGouvernanceResolver = async (
  collectiviteId: number,
  instanceGouvernanceService: InstanceGouvernanceService,
  user: AuthenticatedUser,
  tx?: Transaction
) => {
  const Fuse = await getFuse();
  const tagsResult = await instanceGouvernanceService.list({
    collectiviteId,
    user,
    tx,
  });

  if (!tagsResult.success) {
    return tagsResult;
  }

  const tags = tagsResult.data;
  const searchTags = new Fuse(tags, {
    keys: ['nom'],
    threshold: 0.3,
    ignoreLocation: true,
  });

  const getOrCreateInstanceGouvernance = async (
    name: string,
    tx: Transaction
  ): Promise<Result<Tag, string>> => {
    const foundTag = searchTags.search(name)?.[0]?.item;
    if (foundTag) {
      return success({ id: foundTag.id, nom: foundTag.nom, collectiviteId });
    }

    const created = await instanceGouvernanceService.create({
      nom: name,
      collectiviteId,
      user,
      tx,
    });

    if (created.success === false) {
      return created;
    }

    tags.push(created.data);
    searchTags.setCollection(tags);

    return success(created.data);
  };

  return success({ getOrCreate: getOrCreateInstanceGouvernance });
};
