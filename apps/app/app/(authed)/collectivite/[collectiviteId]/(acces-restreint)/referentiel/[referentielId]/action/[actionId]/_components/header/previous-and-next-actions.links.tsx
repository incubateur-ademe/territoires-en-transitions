import { JSX } from 'react';

import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { Button, cn } from '@tet/ui';

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
      className={cn(
        'border-b-transparent hover:text-primary-9',
        className
      )}
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
  actionId: string;
  headerIsSticky?: boolean;
};

export const PreviousAndNextActionsLinks = ({
  actionId,
  headerIsSticky = false,
}: Props) => {
  const { prevActionLink, nextActionLink } =
    usePrevAndNextActionLinks(actionId);

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
