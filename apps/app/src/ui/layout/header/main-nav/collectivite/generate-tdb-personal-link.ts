import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { isVisitor } from '@tet/domain/users';
import { CollectiviteNavLink } from './make-collectivite-nav';

export const generateTdbPersonalLink = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): CollectiviteNavLink => ({
  visibleWhen: (user) => !isVisitor(user, { collectiviteId }),
  children: 'Mon suivi personnel',
  dataTest: 'tdb-perso',
  href: makeTdbCollectiviteUrl({
    collectiviteId,
    view: 'personnel',
  }),
});
