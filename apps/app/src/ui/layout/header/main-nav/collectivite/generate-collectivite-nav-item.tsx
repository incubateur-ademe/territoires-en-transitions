import { CollectiviteAccess } from '@/domain/users';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { NavItem, Tooltip } from '@/ui';
import { cn } from '@/ui/utils/cn';

export const generateCollectiviteNavItem = (
  collectivites: CollectiviteAccess[],
  currentCollectivite: CollectiviteAccess
): NavItem => {
  const listCollectivites = collectivites.filter(
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
      children: <CollectiviteWithBadge collectivite={c} />,
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
  collectivite: CollectiviteAccess;
  isActive?: boolean;
}) => {
  return (
    <div
      className={cn('w-full flex items-center gap-4', {
        'justify-between': !isActive,
      })}
    >
      <Tooltip label={collectivite.nom} withArrow={false}>
        <span
          className={cn(
            'lg:max-w-[8rem] xl:max-w-[16rem] 2xl:max-w-[20rem] line-clamp-1',
            { 'font-bold': isActive }
          )}
        >
          {collectivite.nom}
        </span>
      </Tooltip>
      <BadgeNiveauAcces
        acces={collectivite.niveauAcces}
        isAuditeur={collectivite.isRoleAuditeur}
      />
    </div>
  );
};
