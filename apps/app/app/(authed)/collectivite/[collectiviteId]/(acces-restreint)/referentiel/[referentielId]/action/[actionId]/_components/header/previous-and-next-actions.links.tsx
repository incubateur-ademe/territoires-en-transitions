import { JSX } from 'react';

import { getPrevAndNextActionLinks } from '@/app/referentiels/actions/get-prev-and-next-action-links.utils';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge, Button, cn } from '@tet/ui';
import { useSearchParams } from 'next/navigation';
import { getActionInfoPanelSearchParams } from '../side-panel/informations.config';

type ActionNavigationButtonProps = {
  direction: 'previous' | 'next';
  href: string;
  size: 'xs' | 'sm';
  onClick?: () => void;
  className?: string;
};

const ActionNavigationButton = ({
  direction,
  href,
  size,
  onClick,
  className,
}: ActionNavigationButtonProps): JSX.Element => {
  const isPrevious = direction === 'previous';

  return (
    <Button
      className={cn('border-b-transparent hover:text-primary-9', className)}
      variant="underlined"
      icon={isPrevious ? 'arrow-left-line' : 'arrow-right-line'}
      iconPosition={isPrevious ? 'left' : 'right'}
      size={size}
      href={href}
      onClick={onClick}
    >
      {isPrevious ? 'Mesure précédente' : 'Mesure suivante'}
    </Button>
  );
};

type Props = {
  action: ActionListItem;
  headerIsSticky?: boolean;
};

export const PreviousAndNextActionsLinks = ({
  action,
  headerIsSticky = false,
}: Props) => {
  const {
    collectiviteId,
    role,
    nom: currentCollectiviteName,
  } = useCurrentCollectivite();
  const currentSearchParams = useSearchParams();

  const { prevActionLink, nextActionLink } = getPrevAndNextActionLinks({
    action,
    collectiviteId,
    searchParams: getActionInfoPanelSearchParams(action, currentSearchParams),
  });

  if (!prevActionLink && !nextActionLink) return null;

  const size = headerIsSticky ? 'xs' : 'sm';

  return (
    <div
      className={cn('flex justify-between border-b border-b-primary-3', {
        'py-1': !headerIsSticky,
        'py-0.5 border-b-2': headerIsSticky,
      })}
    >
      {prevActionLink && (
        <ActionNavigationButton
          direction="previous"
          href={prevActionLink}
          size={size}
        />
      )}

      {headerIsSticky && (
        <div className="m-auto shrink-0 flex border-[0.5px] border-info-3 rounded-md">
          <BadgeNiveauAcces
            acces={role}
            className="!rounded-r-none border-none"
          />
          <Badge
            title={currentCollectiviteName}
            variant={role === null ? 'new' : 'info'}
            type="outlined"
            uppercase={false}
            className="!rounded-l-none border-none"
            size="xs"
            trim={false}
          />
        </div>
      )}

      {nextActionLink && (
        <ActionNavigationButton
          direction="next"
          href={nextActionLink}
          size={size}
        />
      )}
    </div>
  );
};
