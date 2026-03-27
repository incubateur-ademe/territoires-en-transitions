import {
  OpenModaleState,
  SubActionStatutDropdown,
} from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import Markdown from '@/app/ui/Markdown';
import { ActionTypeEnum, StatutAvancementEnum } from '@tet/domain/referentiels';
import { Icon, InfoTooltip } from '@tet/ui';
import { ScoreIndicatifBadge } from '../score-indicatif/score-indicatif.badge';

type Props = {
  subAction: ActionListItem;
  shouldDisplayProgressBar?: boolean;
  openDetailledState?: OpenModaleState;
  isExpanded?: boolean;
};

export const SubactionCardHeader = ({
  subAction,
  shouldDisplayProgressBar = true,
  openDetailledState,
  isExpanded = false,
}: Props) => {
  const isSubAction = subAction.actionType === ActionTypeEnum.SOUS_ACTION;
  const isStatusVisible =
    subAction.score.statut !== StatutAvancementEnum.NON_RENSEIGNABLE;

  return (
    <div
      className="flex flex-col gap-2"
      data-test={`SousActionHeader-${subAction.identifiant}`}
    >
      {(isStatusVisible || subAction.scoreIndicatif) && (
        <div className="flex flex-wrap gap-2">
          {/* Statut */}
          {isStatusVisible && (
            <div className="mt-auto w-full flex max-sm:flex-col gap-3 sm:items-center justify-start">
              {isSubAction && (
                <div
                  data-test={`SousActionHeader-${subAction.identifiant}-expand`}
                >
                  <Icon
                    icon={
                      isExpanded ? 'arrow-down-s-line' : 'arrow-right-s-line'
                    }
                    size="lg"
                  />
                </div>
              )}
              <SubActionStatutDropdown
                action={subAction}
                openDetailledState={openDetailledState}
              />

              {isSubAction && (
                <div className="shrink-0 flex">
                  <ScoreRatioBadge action={subAction} size="xs" />
                </div>
              )}

              {shouldDisplayProgressBar && (
                <ScoreProgressBar
                  action={subAction}
                  className="w-80"
                  displayDoneValue={
                    subAction.actionType === ActionTypeEnum.TACHE
                  }
                  valuePosition="left"
                />
              )}
            </div>
          )}

          {/* Score indicatif */}
          {subAction.scoreIndicatif && (
            <ScoreIndicatifBadge actionId={subAction.actionId} />
          )}
        </div>
      )}

      {/* Identifiant et nom de l'action + infos additionnelles */}
      <div className="text-primary-9 text-base font-bold">
        {subAction.identifiant} {subAction.nom}{' '}
        {subAction.description &&
          subAction.actionType !== ActionTypeEnum.SOUS_ACTION && (
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
    </div>
  );
};
