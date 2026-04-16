import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteNavLink } from './make-collectivite-nav';

export const generateTdbPersonalLink = ({
  collectiviteId,
  isVisitor,
}: {
  collectiviteId: number;
  isVisitor: boolean;
}): CollectiviteNavLink => ({
  isVisible: !isVisitor,
  children: appLabels.navMonSuiviPersonnel,
  dataTest: 'tdb-perso',
  href: makeTdbCollectiviteUrl({
    collectiviteId,
    view: 'personnel',
  }),
});
