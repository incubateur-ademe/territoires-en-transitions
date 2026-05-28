import { ActionStatutDropdownWithDetailleButton } from '@/app/referentiels/actions/action-statut-with-detaille-button.dropdown';
import { useListDiscussions } from '@/app/referentiels/actions/comments/hooks/use-list-discussions';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge, Card, cn, Divider } from '@tet/ui';
import { ActionJustificationField } from '../action.justification-field';
import { ScoreIndicatifActions } from '../score-indicatif/score-indicatif.actions';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import { SidePanelButton } from '../side-panel/buttons';
import { useActionSidePanel } from '../side-panel/context';
import { InformationsSidePanelButton } from '../side-panel/informations.button';
import { hasActionInformationsSections } from '../side-panel/informations.config';

type Props = {
  subAction: ActionListItem;
};

export const Subaction = ({ subAction }: Props) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );

  const { data: discussionsData } = useListDiscussions(
    subAction.referentielId,
    {
      actionId: subAction.actionId,
    }
  );

  const { isActive } = useActionSidePanel();
  const active = isActive('comments', subAction.actionId);

  return (
    <Card className={cn('p-6', { 'border-2 border-primary-7': active })}>
      <div
        data-test={`SousActionHeader-${subAction.identifiant}`}
        className="max-sm:flex-col-reverse gap-6 flex items-baseline justify-between"
      >
        <span className="text-lg">
          {subAction.identifiant} {subAction.nom}
        </span>
        <Badge
          size="xs"
          variant="error"
          title="adaptabilité"
          icon="information-line"
          iconPosition="left"
        />
      </div>
      <div className="flex flex-wrap gap-6 justify-between">
        <div className="flex items-center gap-2">
          <ActionStatutDropdownWithDetailleButton action={subAction} />
          <ScoreRatioBadge action={subAction} size="xs" className="shrink-0" />
          <ScoreProgressBar
            action={subAction}
            className="w-[16rem]"
            valuePosition="left"
          />
        </div>
        <div className="flex items-center gap-2">
          {canReadComments && (
            <SidePanelButton
              key="comments"
              panelId="comments"
              count={discussionsData?.count ?? 0}
              targetActionId={subAction.actionId}
            />
          )}
          {hasActionInformationsSections(subAction) && (
            <InformationsSidePanelButton
              targetActionId={subAction.actionId}
              openedSections={['description', 'exemples']}
            />
          )}
        </div>
      </div>
      <Divider />
      <ScoreIndicatifLibelle action={subAction} />
      <ScoreIndicatifActions action={subAction} />
      <ActionJustificationField action={subAction} />
    </Card>
  );
};
