import ActionLinkedCard from '@/app/referentiels/actions/action.linked-card';
import { useListActionsWithStatuts } from '@/app/referentiels/actions/use-list-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import classNames from 'classnames';
import { useEffect } from 'react';

type ActionsLieesListeProps = {
  isReadonly?: boolean;
  actionIds: string[];
  className?: string;
  onLoad?: (isLoading: boolean) => void;
  onUnlink?: (actionId: string) => void;
};

const ActionsLieesListe = ({
  isReadonly,
  actionIds,
  className,
  onLoad,
  onUnlink,
}: ActionsLieesListeProps) => {
  const { data: actionsLiees, isLoading } = useListActionsWithStatuts({
    actionIds,
  });

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
            key={action.actionId}
            isReadonly={isReadonly}
            action={action}
            onUnlink={onUnlink ? () => onUnlink(action.actionId) : undefined}
            openInNewTab
          />
        ))}
      </div>
    </div>
  );
};

export default ActionsLieesListe;
