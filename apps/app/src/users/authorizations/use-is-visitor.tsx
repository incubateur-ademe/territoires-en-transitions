import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { isUserVisitor } from '@tet/domain/users';

export const useIsVisitor = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const user = useUser();

  return isUserVisitor(user, { collectiviteId });
};
