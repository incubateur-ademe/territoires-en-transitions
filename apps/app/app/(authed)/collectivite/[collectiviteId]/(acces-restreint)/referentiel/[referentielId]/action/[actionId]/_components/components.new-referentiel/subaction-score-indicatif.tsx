import { useGetActionChildren } from '@/app/referentiels/actions/use-get-action-children';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, Divider } from '@tet/ui';
import { useMemo, useState } from 'react';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import { ScoreIndicatifModal } from '../score-indicatif/score-indicatif.modal';
import { ScoreIndicatifAction } from '../score-indicatif/score-indicatif.types';
import { useGetScoreIndicatif } from '../score-indicatif/use-get-score-indicatif';

type Props = {
  subAction: ActionListItem;
};

const hasExprScore = (action: ActionListItem) =>
  Boolean(action.exprScore && action.exprScore.trim() !== '');

export const SubactionScoreIndicatifList = ({ subAction }: Props) => {
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

  const actionIds = useMemo(
    () => actionsToDisplay.map((a) => a.actionId),
    [actionsToDisplay]
  );

  const { data: scoreIndicatifByActionId, isLoading } = useGetScoreIndicatif({
    actionIds,
    enabled: actionIds.length > 0,
  });

  if (actionsToDisplay.length === 0 || isLoading) {
    return null;
  }

  return (
    <>
      <Divider />
      <div className="flex flex-col gap-4">
        {actionsToDisplay.map((action) => (
          <ScoreIndicatif
            key={action.actionId}
            action={action}
            scoreIndicatif={scoreIndicatifByActionId?.[action.actionId]}
            showHeader={actionsToDisplay.length > 1}
          />
        ))}
      </div>
    </>
  );
};

const ScoreIndicatif = ({
  action,
  scoreIndicatif,
  showHeader,
}: {
  action: ActionListItem;
  scoreIndicatif?: ScoreIndicatifAction;
  showHeader: boolean;
}) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  if (!scoreIndicatif) {
    return null;
  }

  const hasValeursRenseignees =
    scoreIndicatif.fait?.valeursUtilisees?.length &&
    scoreIndicatif.programme?.valeursUtilisees?.length;

  return (
    <>
      <div className="flex flex-col gap-2">
        {showHeader && (
          <p className="mb-0 font-bold text-grey-8">{action.nom}</p>
        )}
        {/** Informations du score indicatif */}
        <ScoreIndicatifLibelle
          action={action}
          scoreIndicatif={scoreIndicatif}
        />
        {/** Boutons de modification des données */}
        {hasCollectivitePermission('referentiels.mutate') && (
          <Button
            size="xs"
            variant={hasValeursRenseignees ? 'outlined' : 'primary'}
            onClick={() => {
              setIsScoreModalOpen(true);
            }}
          >
            {hasValeursRenseignees
              ? 'Modifier les données'
              : 'Renseigner les données'}
          </Button>
        )}
      </div>
      {isScoreModalOpen && (
        <ScoreIndicatifModal
          scoreIndicatif={scoreIndicatif}
          openState={{
            isOpen: isScoreModalOpen,
            setIsOpen: setIsScoreModalOpen,
          }}
        />
      )}
    </>
  );
};
