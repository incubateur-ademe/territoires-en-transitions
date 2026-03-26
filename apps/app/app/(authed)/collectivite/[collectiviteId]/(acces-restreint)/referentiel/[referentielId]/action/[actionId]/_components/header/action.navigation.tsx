import classNames from 'classnames';

import { getPrevAndNextActionLinks } from '@/app/referentiels/actions/get-prev-and-next-action-links.utils';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';

type Props = {
  action: ActionListItem;
  headerIsSticky?: boolean;
};

const ActionNavigation = ({ action, headerIsSticky = false }: Props) => {
  const { collectiviteId } = useCurrentCollectivite();
  const { prevActionLink, nextActionLink } = getPrevAndNextActionLinks({
    action,
    collectiviteId,
  });

  if (!prevActionLink && !nextActionLink) {
    return null;
  }

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
