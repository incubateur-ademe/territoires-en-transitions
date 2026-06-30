import { appLabels } from '@/app/labels/catalog';
import { useGetActionChildren } from '@/app/referentiels/actions/use-get-action-children';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { Divider } from '@tet/ui';
import { useMemo } from 'react';
import { SubactionIndicateur } from './subaction.indicateur';

type Props = {
  subAction: ActionListItem;
};

const hasExprScore = (action: ActionListItem) =>
  Boolean(action.exprScore && action.exprScore.trim() !== '');

export const SubactionIndicateurList = ({ subAction }: Props) => {
  const children = useGetActionChildren({ actionId: subAction.actionId });

  const childrenWithScoreIndicatif = useMemo(
    () => children.filter(hasExprScore),
    [children]
  );

  const actionsToDisplay = useMemo(() => {
    const actions: ActionListItem[] = [];
    if (hasExprScore(subAction)) {
      actions.push(subAction);
    }
    actions.push(...childrenWithScoreIndicatif);
    return actions;
  }, [subAction, childrenWithScoreIndicatif]);

  if (actionsToDisplay.length === 0) {
    return null;
  }

  return (
    <>
      <Divider />
      <span className="text-sm font-medium text-grey-8">
        {appLabels.indicateursLiesAuScore}
      </span>
      <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-4">
        {actionsToDisplay.map((action) => (
          <SubactionIndicateur key={action.actionId} action={action} />
        ))}
      </div>
    </>
  );
};
