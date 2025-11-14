import classNames from 'classnames';

import { useActionId } from '@/app/referentiels/actions/action-context';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { Button } from '@/ui';
import { useCommentPanel } from '../comments/hooks/use-comment-panel';

type Props = {
  actionId: string;
  headerIsSticky?: boolean;
};

const ActionNavigation = ({ actionId, headerIsSticky = false }: Props) => {
  const { prevActionLink, nextActionLink, nextActionId, prevActionId } =
    usePrevAndNextActionLinks(actionId);

  const { panel } = useSidePanel();
  const referentielId = useReferentielId();
  const { openPanel } = useCommentPanel(referentielId, useActionId());

  if (!prevActionLink && !nextActionLink) return null;

  const handleClick = (actionId: string) => {
    if (panel.isOpen) {
      openPanel(actionId);
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
