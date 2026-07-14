import {
  makeCollectiviteUsersUrl,
  makeMaCollectiviteUrl,
  makeTdbCollectiviteUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { getRejoindreCollectivitePath } from '@tet/api';
import {
  CollectiviteCurrent,
  toCollectiviteCurrent,
} from '@tet/api/collectivites';
import { isUserVisitor, UserWithRolesAndPermissions } from '@tet/domain/users';
import { NavItem, NavLink, Tooltip } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { filterNavItems } from './make-collectivite-nav';

export const generateCollectiviteNavItem = (
  user: UserWithRolesAndPermissions,
  currentCollectivite: CollectiviteCurrent
): NavItem => {
  const isSimplifiedView = currentCollectivite.isSimplifiedView;

  const isVisitor = isUserVisitor(user, {
    collectiviteId: currentCollectivite.collectiviteId,
  });

  const isCollectiviteAccesRestreint =
    currentCollectivite.collectiviteAccesRestreint;

  const isCollectiviteAccesRestreintAndVisitor =
    isCollectiviteAccesRestreint && isVisitor;

  const isVisible = !isCollectiviteAccesRestreintAndVisitor || isSimplifiedView;

  const otherCollectivites = user.collectivites.filter(
    ({ collectiviteId }) =>
      collectiviteId !== currentCollectivite.collectiviteId
  );

  if (isSimplifiedView && otherCollectivites.length === 0) {
    return {
      children: <CollectiviteWithBadge collectivite={currentCollectivite} />,
      href: makeTdbCollectiviteUrl({
        collectiviteId: currentCollectivite.collectiviteId,
      }),
    };
  }

  const links = [
    {
      isVisible,
      children: appLabels.gestionDesUtilisateurs,
      dataTest: 'params-membres',
      href: makeCollectiviteUsersUrl({
        collectiviteId: currentCollectivite.collectiviteId,
      }),
    },
    {
      isVisible,
      children: appLabels.identiteEtPersonnalisation,
      dataTest: 'params-collectivite',
      href: makeMaCollectiviteUrl({
        collectiviteId: currentCollectivite.collectiviteId,
      }),
      urlPrefix: ['/ma-collectivite'],
    },
    ...otherCollectivites.map((c) => ({
      children: (
        <CollectiviteWithBadge collectivite={toCollectiviteCurrent(c, user)} />
      ),
      href: makeTdbCollectiviteUrl({
        collectiviteId: c.collectiviteId,
      }),
    })),
    {
      isVisible: !isSimplifiedView,
      children: appLabels.rejoindreUneCollectivite,
      href: getRejoindreCollectivitePath(document.location.origin),
      icon: 'add-line',
    },
  ];

  return {
    children: <CollectiviteWithBadge collectivite={currentCollectivite} />,
    links: filterNavItems(links) as NavLink[],
  };
};

const CollectiviteWithBadge = ({
  collectivite,
}: {
  collectivite: CollectiviteCurrent;
}) => {
  return (
    <div className="w-full flex items-center gap-4">
      <Tooltip label={collectivite.collectiviteNom} withArrow={false}>
        <span
          className={cn(
            'flex-grow lg:max-w-[8rem] xl:max-w-[16rem] 2xl:max-w-[20rem] font-bold line-clamp-1'
          )}
        >
          {collectivite.collectiviteNom}
        </span>
      </Tooltip>
      <BadgeNiveauAcces collectivite={collectivite} />
    </div>
  );
};
