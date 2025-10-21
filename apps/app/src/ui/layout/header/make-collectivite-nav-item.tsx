import { CurrentCollectivite } from '@/api/collectivites';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { NavItem, Tooltip } from '@/ui';
import { cn } from '@/ui/utils/cn';

export const makeCollectiviteNavItem = (
  collectivites: CurrentCollectivite[],
  currentCollectivite: CurrentCollectivite
): NavItem => {
  const listCollectivites = collectivites.filter(
    ({ nom }) => nom !== currentCollectivite.nom
  );

  if (listCollectivites.length === 0) {
    return {
      children: (
        <CollectiviteWithBadge
          collectivite={currentCollectivite}
          isCurrentCollectivite
        />
      ),
      href: makeTdbCollectiviteUrl({
        collectiviteId: currentCollectivite.collectiviteId,
        view: 'synthetique',
      }),
    };
  }
  return {
    children: (
      <CollectiviteWithBadge
        collectivite={currentCollectivite}
        isCurrentCollectivite
      />
    ),
    links: listCollectivites.map((c) => ({
      children: <CollectiviteWithBadge collectivite={c} />,
      href: makeTdbCollectiviteUrl({
        collectiviteId: c.collectiviteId,
        view: 'synthetique',
      }),
    })),
  };
};

const CollectiviteWithBadge = ({
  collectivite,
  isCurrentCollectivite,
}: {
  collectivite: CurrentCollectivite;
  isCurrentCollectivite?: boolean;
}) => {
  return (
    <div
      className={cn('w-full flex items-center gap-4', {
        'justify-between': !isCurrentCollectivite,
      })}
    >
      <Tooltip label={collectivite.nom} withArrow={false}>
        <span
          className={cn(
            'lg:max-w-[8rem] xl:max-w-[16rem] 2xl:max-w-[20rem] line-clamp-1',
            { 'font-bold': isCurrentCollectivite }
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
