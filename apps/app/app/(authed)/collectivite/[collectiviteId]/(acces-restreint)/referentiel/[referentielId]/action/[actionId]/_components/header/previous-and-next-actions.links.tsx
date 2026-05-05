import { JSX } from 'react';

import { getPrevAndNextActionLinks } from '@/app/referentiels/actions/get-prev-and-next-action-links.utils';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, cn } from '@tet/ui';
import { useSearchParams } from 'next/navigation';

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
  const { collectiviteId } = useCurrentCollectivite();
  const searchParams = useSearchParams();

  const { prevActionLink, nextActionLink } = getPrevAndNextActionLinks({
    action,
    collectiviteId,
    searchParams,
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

      {nextActionLink && (
        <ActionNavigationButton
          direction="next"
          href={nextActionLink}
          size={size}
          className="ml-auto"
        />
      )}
    </div>
  );
};
