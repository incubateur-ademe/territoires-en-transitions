import { ActionStatutDropdownWithDetailleButton } from '@/app/referentiels/actions/action-statut-with-detaille-button.dropdown';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Card, cn } from '@tet/ui';
import { useEffect } from 'react';
import { ActionExplicationField } from '../action-explication.field';
import { useActionSidePanel } from '../side-panel/context';
import { InformationsSidePanelButton } from '../side-panel/informations.button';
import { hasActionInformationsSections } from '../side-panel/informations.config';
import { SubactionCommentsButton } from './subaction-comments.button';
import { SubactionScoreIndicatifList } from './subaction-score-indicatif';

type Props = {
  subAction: ActionListItem;
};

export const Subaction = ({ subAction }: Props) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );

  const { activeActionId } = useActionSidePanel();
  const active = activeActionId === subAction.actionId;

  useEffect(() => {
    if (active) {
      requestAnimationFrame(() => {
        document
          .getElementById(subAction.actionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [active, subAction.actionId]);

  return (
    <Card
      id={subAction.actionId}
      className={cn('scroll-mt-72 p-6', { 'border border-primary-7': active })}
    >
      <div
        data-test={`SousActionHeader-${subAction.identifiant}`}
        className="max-sm:flex-col-reverse gap-6 flex items-baseline justify-between"
      >
        <span className="text-lg">
          {subAction.identifiant} {subAction.nom}
        </span>
        {/*<Badge
          size="xs"
          variant="error"
          title="adaptation"
          icon="information-line"
          iconPosition="left"
        />*/}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-4 justify-between">
        <div className="flex items-center gap-2">
          <ActionStatutDropdownWithDetailleButton
            action={subAction}
            disabledDetailleALaTache
          />
          <ScoreRatioBadge action={subAction} size="xs" className="shrink-0" />
          <ScoreProgressBar
            action={subAction}
            className="w-[16rem]"
            valuePosition="left"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasActionInformationsSections(subAction) && (
            <InformationsSidePanelButton
              targetActionId={subAction.actionId}
              openedSections={['description', 'exemples']}
            />
          )}
          {canReadComments && <SubactionCommentsButton subAction={subAction} />}
        </div>
      </div>
      <SubactionScoreIndicatifList subAction={subAction} />
      <ActionExplicationField action={subAction} />
    </Card>
  );
};
