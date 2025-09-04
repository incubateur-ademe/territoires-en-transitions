import classNames from 'classnames';

import { CollectiviteProvider, useCollectiviteId } from '@/api/collectivites';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { Button } from '@/ui';
import ActionCommentsPanel from '../comments/action-comments.panel';

type Props = {
  actionId: string;
  headerIsSticky?: boolean;
};

const ActionNavigation = ({ actionId, headerIsSticky = false }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { prevActionLink, nextActionLink, nextActionId, prevActionId } =
    usePrevAndNextActionLinks(actionId);

  const { panel, setPanel } = useSidePanel();

  if (!prevActionLink && !nextActionLink) return null;

  const handleClick = (actionId: string) => {
    if (panel.isOpen) {
      setPanel({
        type: 'open',
        isPersistentWithNextPath: (pathname) =>
          pathname === nextActionLink || pathname === prevActionLink,
        title: 'Commentaires',
        content: (
          <CollectiviteProvider collectiviteId={collectiviteId}>
            <ActionCommentsPanel actionId={actionId} />
          </CollectiviteProvider>
        ),
      });
    }
  };

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
          onClick={() => prevActionId && handleClick(prevActionId)}
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
          onClick={() => nextActionId && handleClick(nextActionId)}
        >
          Mesure suivante
        </Button>
      )}
    </div>
  );
};

export default ActionNavigation;
