import ActionLinkedCard from '@/app/referentiels/actions/action.linked-card';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import classNames from 'classnames';
import { useEffect } from 'react';

type MesuresLieesListeProps = {
  isReadonly?: boolean;
  /**
   * Spécifie une collectivité lorsqu'on charge les données d'une autrre collectivité que la collectivité courante.
   */
  externalCollectiviteId?: number;
  mesuresIds: string[];
  className?: string;
  onLoad?: (isLoading: boolean) => void;
  onUnlink?: (actionId: string) => void;
};

export const MesuresLieesListe = ({
  isReadonly,
  externalCollectiviteId,
  mesuresIds,
  className,
  onLoad,
  onUnlink,
}: MesuresLieesListeProps) => {
  const { data: actionsLiees, isLoading } = useListActions(
    {
      actionIds: mesuresIds,
    },
    true,
    externalCollectiviteId
  );

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
          'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3',
          className
        )}
      >
        {actionsLiees.map((action) => (
          <ActionLinkedCard
            key={action.actionId}
            externalCollectiviteId={externalCollectiviteId}
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
