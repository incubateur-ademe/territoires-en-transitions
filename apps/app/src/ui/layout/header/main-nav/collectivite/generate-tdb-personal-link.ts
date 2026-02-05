import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { CollectiviteNavLink } from './make-collectivite-nav';

export const generateTdbPersonalLink = ({
  collectiviteId,
  isVisitor,
}: {
  collectiviteId: number;
  isVisitor: boolean;
}): CollectiviteNavLink => ({
  isVisible: !isVisitor,
  children: 'Mon suivi personnel',
  dataTest: 'tdb-perso',
  href: makeTdbCollectiviteUrl({
    collectiviteId,
    view: 'personnel',
  }),
});
