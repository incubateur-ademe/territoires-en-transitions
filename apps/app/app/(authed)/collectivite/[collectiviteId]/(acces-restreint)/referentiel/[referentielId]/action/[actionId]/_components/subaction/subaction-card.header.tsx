import { SubActionStatutDropdown } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import Markdown from '@/app/ui/Markdown';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { cn, Icon, InfoTooltip, VisibleWhen } from '@tet/ui';
import { ReactNode } from 'react';

type ExpandCollapseButtonProps = {
  isExpanded: boolean;
  onClick?: () => void;
  'aria-label'?: string;
};

const ExpandCollapseButton = ({
  isExpanded,
  onClick,
  'aria-label': ariaLabel,
}: ExpandCollapseButtonProps): ReactNode => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={isExpanded}
    aria-label={ariaLabel}
    className={cn(
      'transition-transform flex items-center justify-center cursor-pointer',
      {
        'rotate-90': isExpanded,
      }
    )}
  >
    <Icon icon="arrow-right-s-line" size="lg" />
  </button>
);

type Props = {
  subAction: ActionDefinitionSummary;
  shouldDisplayProgressBar?: boolean;
  hideStatus?: boolean;
  isExpanded?: boolean;
  toggleExpand?: () => void;
  actions?: ReactNode[];
};

export const SubactionCardHeader = ({
  subAction,
  shouldDisplayProgressBar = true,
  hideStatus = false,
  isExpanded,
  toggleExpand,
  actions,
}: Props) => {
  const isSubAction = subAction.type === ActionTypeEnum.SOUS_ACTION;

  const taskCanBeExpanded = isSubAction && isExpanded !== undefined;
  return (
    <div
      className="flex flex-col gap-2"
      data-test={`SousActionHeader-${subAction.identifiant}`}
    >
      {(!hideStatus || subAction.haveScoreIndicatif) && (
        <div className="flex flex-wrap gap-2">
          {/* Statut */}
          {!hideStatus && (
            <div className="mt-auto w-full flex max-sm:flex-col sm:items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <VisibleWhen condition={taskCanBeExpanded}>
                  <ExpandCollapseButton
                    isExpanded={!!isExpanded}
                    onClick={toggleExpand}
                    aria-label={`Déplier la sous-action ${subAction.identifiant}`}
                  />
                </VisibleWhen>
                <div
                  className="flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SubActionStatutDropdown actionDefinition={subAction} />

                  {isSubAction && (
                    <div className="shrink-0 flex">
                      <ScoreRatioBadge actionId={subAction.id} size="xs" />
                    </div>
                  )}
                </div>
              </div>
              {actions && actions.length > 0 && (
                <div
                  className="justify-self-end flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {shouldDisplayProgressBar && (
        <ScoreProgressBar
          id={subAction.id}
          identifiant={subAction.identifiant}
          type={subAction.type}
          className="w-full"
          displayDoneValue={subAction.type === ActionTypeEnum.TACHE}
          valuePosition="left"
        />
      )}

      {/* Identifiant et nom de l'action + infos additionnelles */}
      <div className="text-primary-9 text-base font-bold mb-2">
        {subAction.identifiant} {subAction.nom}{' '}
        {subAction.description &&
          subAction.type !== ActionTypeEnum.SOUS_ACTION && (
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
