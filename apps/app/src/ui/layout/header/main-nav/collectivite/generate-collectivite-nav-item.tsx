import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { CollectiviteCurrent, toCollectiviteCurrent } from '@tet/api/collectivites';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { NavItem, Tooltip } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';

export const generateCollectiviteNavItem = (
  user: UserWithRolesAndPermissions,
  currentCollectivite: CollectiviteCurrent
): NavItem => {
  const listCollectivites = user.collectivites.filter(
    ({ collectiviteId }) =>
      collectiviteId !== currentCollectivite.collectiviteId
  );

  if (listCollectivites.length === 0) {
    return {
      children: (
        <CollectiviteWithBadge collectivite={currentCollectivite} isActive />
      ),
      href: makeTdbCollectiviteUrl({
        collectiviteId: currentCollectivite.collectiviteId,
      }),
    };
  }
  return {
    children: (
      <CollectiviteWithBadge collectivite={currentCollectivite} isActive />
    ),
    links: listCollectivites.map((c) => ({
      children: (
        <CollectiviteWithBadge collectivite={toCollectiviteCurrent(c, user)} />
      ),
      href: makeTdbCollectiviteUrl({
        collectiviteId: c.collectiviteId,
      }),
    })),
  };
};

const CollectiviteWithBadge = ({
  collectivite,
  isActive,
}: {
  collectivite: CollectiviteCurrent;
  isActive?: boolean;
}) => {
  return (
    <div
      className={cn('w-full flex items-center gap-4', {
        'justify-between': !isActive,
      })}
    >
      <Tooltip label={collectivite.collectiviteNom} withArrow={false}>
        <span
          className={cn(
            'lg:max-w-[8rem] xl:max-w-[16rem] 2xl:max-w-[20rem] line-clamp-1',
            { 'font-bold': isActive }
          )}
        >
          {collectivite.collectiviteNom}
        </span>
      </Tooltip>
      <BadgeNiveauAcces collectivite={collectivite} />
    </div>
  );
};
