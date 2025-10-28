import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { CollectiviteNavLink } from './make-collectivite-nav';

export const generateTdbPersonalLink = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): CollectiviteNavLink => ({
  hideWhenVisitor: true,
  children: 'Mon suivi personnel',
  dataTest: 'tdb-perso',
  href: makeTdbCollectiviteUrl({
    collectiviteId,
    view: 'personnel',
  }),
});
