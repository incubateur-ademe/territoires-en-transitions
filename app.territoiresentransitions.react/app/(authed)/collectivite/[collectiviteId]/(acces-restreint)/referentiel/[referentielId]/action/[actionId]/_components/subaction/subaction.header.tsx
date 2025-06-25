import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  OpenModaleState,
  SubActionStatutDropdown,
} from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import Markdown from '@/app/ui/Markdown';
import { ActionTypeEnum } from '@/backend/referentiels/index-domain';
import { InfoTooltip } from '@/ui';
import { ScoreIndicatifBadge } from '../score-indicatif/score-indicatif.badge';

type Props = {
  subAction: ActionDefinitionSummary;
  shouldDisplayProgressBar: boolean;
  hideStatus?: boolean;
  openDetailledState?: OpenModaleState;
  haveScoreIndicatif?: boolean;
};

const SubactionHeader = ({
  subAction,
  shouldDisplayProgressBar,
  hideStatus = false,
  openDetailledState,
  haveScoreIndicatif = false,
}: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {/* Statut */}
        {!hideStatus && (
          <SubActionStatutDropdown
            actionDefinition={subAction}
            openDetailledState={openDetailledState}
          />
        )}

        {/* Score indicatif */}
        {haveScoreIndicatif && <ScoreIndicatifBadge actionId={subAction.id} />}
      </div>

      {/* Identifiant et nom de l'action + infos additionnelles */}
      <div className="text-primary-9 text-base font-bold">
        {subAction.identifiant} {subAction.nom}{' '}
        {subAction.description && subAction.referentiel === 'cae' && (
          <InfoTooltip
            label={
              <Markdown
                className="max-w-sm font-normal"
                content={subAction.description}
              />
            }
            activatedBy="click"
            iconClassName="ml-1"
          />
        )}
      </div>

      {/* Score réalisé */}
      {shouldDisplayProgressBar && !hideStatus && (
        <div className="mt-auto flex max-sm:flex-col gap-3 sm:items-center justify-between">
          <ScoreProgressBar
            id={subAction.id}
            identifiant={subAction.identifiant}
            type={subAction.type}
            className="grow shrink max-sm:w-full"
            displayDoneValue={subAction.type === ActionTypeEnum.TACHE}
            valuePosition="right"
          />
          {subAction.type === ActionTypeEnum.SOUS_ACTION && (
            <div className="shrink-0 flex sm:justify-end">
              <ScoreRatioBadge actionId={subAction.id} size="sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubactionHeader;
