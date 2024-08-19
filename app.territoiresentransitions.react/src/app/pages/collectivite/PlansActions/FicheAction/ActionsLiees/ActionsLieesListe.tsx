import {useEffect} from 'react';
import classNames from 'classnames';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import {useActionListe} from '../data/options/useActionListe';
import ActionCard from './ActionCard';

type ActionsLieesListeProps = {
  isReadonly?: boolean;
  actionsIds: string[];
  isFicheTab?: boolean;
  onLoad?: (isLoading: boolean) => void;
  onUpdateActionsLiees?: (actionsId: string[]) => void;
};

const ActionsLieesListe = ({
  isReadonly,
  actionsIds,
  isFicheTab = false,
  onLoad,
  onUpdateActionsLiees,
}: ActionsLieesListeProps) => {
  const {data: actionListe, isLoading} = useActionListe();

  useEffect(() => onLoad?.(isLoading), [isLoading]);

  if (isLoading) {
    return <SpinnerLoader className="mx-auto my-8" />;
  }

  const actionsLiees = (actionListe ?? []).filter(action =>
    actionsIds.some(id => id === action.action_id)
  );

  if (actionsLiees.length === 0) return null;

  return (
    // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
    <div>
      <div
        className={classNames('grid lg:grid-cols-2 xl:grid-cols-3 gap-3', {
          'sm:grid-cols-2 md:grid-cols-3': isFicheTab,
        })}
      >
        {actionsLiees.map(action => (
          <ActionCard
            key={action.action_id}
            isReadonly={isReadonly}
            action={action}
            onUnlink={
              onUpdateActionsLiees
                ? () =>
                    onUpdateActionsLiees(
                      actionsIds.filter(id => id !== action.action_id)
                    )
                : undefined
            }
            openInNewTab
          />
        ))}
      </div>
    </div>
  );
};

export default ActionsLieesListe;
