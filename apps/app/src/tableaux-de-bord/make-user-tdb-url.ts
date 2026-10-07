import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import {
  hasOwnCollectiviteRole,
  UserRolesAndPermissions,
} from '@tet/domain/users';

export const makeUserTdbUrl = ({
  user,
  collectiviteId,
}: {
  user: UserRolesAndPermissions;
  collectiviteId: number;
}): string =>
  makeTdbCollectiviteUrl({
    collectiviteId,
    view: hasOwnCollectiviteRole(user, { collectiviteId })
      ? 'personnel'
      : 'synthetique',
  });
