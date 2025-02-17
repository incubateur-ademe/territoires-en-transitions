import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import classNames from 'classnames';
import { useEffect } from 'react';
import ActionLinkedCard from '../../../../../../referentiels/actions/action.linked-card';
import { useActionListe } from '../data/options/useActionListe';

type ActionsLieesListeProps = {
  isReadonly?: boolean;
  actionsIds: string[];
  className?: string;
  onLoad?: (isLoading: boolean) => void;
  onUnlink?: (actionId: string) => void;
};

const ActionsLieesListe = ({
  isReadonly,
  actionsIds,
  className,
  onLoad,
  onUnlink,
}: ActionsLieesListeProps) => {
  const { data: actionsLiees, isLoading } = useActionListe(actionsIds);

  useEffect(() => onLoad?.(isLoading), [isLoading]);

  if (isLoading) {
    return <SpinnerLoader className="mx-auto my-8" />;
  }

  if (!actionsLiees?.length) return null;

  return (
    // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
    <div>
      <div
        className={classNames(
          'grid lg:grid-cols-2 xl:grid-cols-3 gap-3',
          className
        )}
      >
        {actionsLiees.map((action) => (
          <ActionLinkedCard
            key={action.action_id}
            isReadonly={isReadonly}
            action={action}
            onUnlink={onUnlink ? () => onUnlink(action.action_id) : undefined}
            openInNewTab
          />
        ))}
      </div>
    </div>
  );
};

export default ActionsLieesListe;
