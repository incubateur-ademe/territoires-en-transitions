import { Button } from '@/ui';
import classNames from 'classnames';

type Props = {
  prevActionLink: string | undefined;
  nextActionLink: string | undefined;
  headerIsSticky?: boolean;
};

const ActionNavigation = ({
  prevActionLink,
  nextActionLink,
  headerIsSticky = false,
}: Props) => {
  if (!prevActionLink && !nextActionLink) return null;

  return (
    <div
      className={classNames(
        'flex justify-between border-b border-b-primary-3',
        {
          'py-1': !headerIsSticky,
          'py-0.5 border-b-2': headerIsSticky,
        }
      )}
    >
      {prevActionLink && (
        <Button
          className="border-b-transparent hover:text-primary-9"
          variant="underlined"
          icon="arrow-left-line"
          size={headerIsSticky ? 'xs' : 'sm'}
          href={prevActionLink}
        >
          Mesure précédente
        </Button>
      )}

      {nextActionLink && (
        <Button
          className="ml-auto border-b-transparent hover:text-primary-9"
          variant="underlined"
          icon="arrow-right-line"
          iconPosition="right"
          size={headerIsSticky ? 'xs' : 'sm'}
          href={nextActionLink}
        >
          Mesure suivante
        </Button>
      )}
    </div>
  );
};

export default ActionNavigation;
