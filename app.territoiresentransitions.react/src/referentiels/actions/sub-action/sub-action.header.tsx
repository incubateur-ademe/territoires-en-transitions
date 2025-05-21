import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import { BadgeScoreIndicateur } from '@/app/referentiels/actions/badge-score-indicateur';
import { SubActionStatutDropdown } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import ScoreShow from '@/app/referentiels/scores/score.show';
import Markdown from '@/app/ui/Markdown';
import { Icon, InfoTooltip } from '@/ui';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { useScore } from '../../use-snapshot';

type SubActionHeaderProps = {
  actionDefinition: ActionDefinitionSummary;
  hideStatus?: boolean;
  statusWarningMessage?: boolean;
  displayProgressBar?: boolean;
  displayActionCommentaire?: boolean;
  openSubAction?: boolean;
  onToggleOpen?: () => void;
};

/**
 * En-tête des sous-actions / tâches dans le suivi de l'action
 */

const SubActionHeader = ({
  actionDefinition,
  hideStatus = false,
  statusWarningMessage = false,
  displayProgressBar = false,
  displayActionCommentaire = false,
  openSubAction = false,
  onToggleOpen,
}: SubActionHeaderProps): JSX.Element => {
  const score = useScore(actionDefinition.id);

  const [open, setOpen] = useState(openSubAction);
  const isSubAction = actionDefinition.type === 'sous-action';
  const isTask = actionDefinition.type === 'tache';

  useEffect(() => setOpen(openSubAction), [openSubAction]);

  const handleOnClick = () => {
    setOpen((prevState) => !prevState);
    if (onToggleOpen) onToggleOpen();
  };

  return (
    <div
      className={classNames('group grid gap-y-10 gap-x-3 items-start py-4', {
        'grid-cols-[5rem_1fr_fit-content(10rem)]': isSubAction,
        'grid-cols-[3rem_1fr_fit-content(10rem)]': !isSubAction,
        'rounded-lg cursor-pointer px-6': isSubAction,
        'px-0': isTask,
        'bg-[#f5f5fE]': isSubAction && open,
        'hover:bg-grey975': isSubAction && !open,
      })}
      onClick={handleOnClick}
    >
      {/* Identifiant de l'action et bouton open / close */}
      <div
        className={classNames('flex gap-3', {
          'font-bold': isSubAction,
        })}
      >
        {isSubAction && (
          <Icon
            icon={open ? 'arrow-down-s-line' : 'arrow-right-s-line'}
            size="lg"
            className="text-primary-10"
          />
        )}
        {actionDefinition.identifiant}
      </div>

      {/* Nom de l'action et score réalisé */}
      <div className="flex flex-col justify-between gap-3">
        <div className={classNames({ 'font-bold': isSubAction })}>
          {actionDefinition.nom}
          {actionDefinition.description &&
            ((isSubAction && actionDefinition.referentiel === 'cae') ||
              isTask) && (
              <InfoTooltip
                label={
                  <Markdown
                    className="max-w-sm font-normal"
                    content={actionDefinition.description}
                  />
                }
                activatedBy="click"
                iconClassName="ml-2"
              />
            )}
        </div>

        {isSubAction && (
          <div className="flex gap-2">
            <div className="w-[140px]">
              <ScoreShow
                score={score?.pointFait ?? null}
                scoreMax={score?.pointPotentiel ?? null}
                size="xs"
              />
            </div>

            {displayProgressBar && (
              <div className="flex justify-end w-[155px]">
                <ScoreProgressBar
                  id={actionDefinition.id}
                  identifiant={actionDefinition.identifiant}
                  type={actionDefinition.type}
                  displayDoneValue
                />
              </div>
            )}
          </div>
        )}
      </div>
      {/* Menu de sélection du statut */}
      {!hideStatus && (
        <SubActionStatutDropdown
          actionDefinition={actionDefinition}
          statusWarningMessage={statusWarningMessage}
        />
      )}

      {displayActionCommentaire && (
        <div className="col-span-full" onClick={(evt) => evt.stopPropagation()}>
          <ActionCommentaire action={actionDefinition} />
        </div>
      )}
      {actionDefinition.have_score_indicatif && (
        <div className="col-span-full">
          <BadgeScoreIndicateur />
        </div>
      )}
    </div>
  );
};

export default SubActionHeader;
