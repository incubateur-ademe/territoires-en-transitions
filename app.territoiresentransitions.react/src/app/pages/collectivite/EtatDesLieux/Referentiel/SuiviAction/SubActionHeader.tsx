import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useEffect, useState} from 'react';
import {
  ActionStatusDropdown,
  StatusToSavePayload,
} from 'ui/referentiels/ActionStatusDropdown';
import {Tooltip} from 'ui/shared/floating-ui/Tooltip';
import ScoreDisplay from 'ui/referentiels/ScoreDisplay';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {SuiviScoreRow} from '../data/useScoreRealise';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';

type SubActionHeaderProps = {
  action: ActionDefinitionSummary;
  actionScores: {[actionId: string]: SuiviScoreRow};
  hideStatus?: boolean;
  displayProgressBar?: boolean;
  displayActionCommentaire?: boolean;
  openSubAction?: boolean;
  onToggleOpen?: () => void;
  onSaveStatus?: (payload: StatusToSavePayload) => void;
};

/**
 * En-tête des sous-actions / tâches dans le suivi de l'action
 */

const SubActionHeader = ({
  action,
  actionScores,
  hideStatus = false,
  displayProgressBar = false,
  displayActionCommentaire = false,
  openSubAction = false,
  onToggleOpen,
  onSaveStatus,
}: SubActionHeaderProps): JSX.Element => {
  const [open, setOpen] = useState(openSubAction);
  const isSubAction = action.type === 'sous-action';
  const isTask = action.type === 'tache';

  useEffect(() => setOpen(openSubAction), [openSubAction]);

  const handleOnClick = () => {
    setOpen(prevState => !prevState);
    if (onToggleOpen) onToggleOpen();
  };

  return (
    <div
      className={classNames('py-4 group', {
        'rounded-lg cursor-pointer px-6': isSubAction,
        'px-0': isTask,
        'bg-[#f5f5fE]': isSubAction && open,
        'hover:bg-grey975': isSubAction && !open,
      })}
      onClick={handleOnClick}
    >
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Identifiant de l'action et bouton open / close */}
        <div
          className={classNames(
            'flex justify-between lg:col-span-1 col-span-2',
            {
              'font-bold': isSubAction,
            }
          )}
        >
          {isSubAction && (
            <span
              className={classNames('text-bf500', {
                'fr-icon-arrow-down-s-fill': open,
                'fr-icon-arrow-right-s-fill': !open,
              })}
            />
          )}
          {action.identifiant}
        </div>

        {/* Nom de l'action et score réalisé */}
        <div className="lg:col-span-9 col-span-7 flex flex-col gap-3">
          <div className={classNames({'font-bold': isSubAction})}>
            {action.nom}
            {action.description &&
              ((isSubAction && action.referentiel === 'cae') || isTask) && (
                <span onClick={evt => evt.stopPropagation()}>
                  <Tooltip label={action.description} activatedBy="click">
                    <span className="fr-fi-information-line pl-2 text-bf500 cursor-pointer" />
                  </Tooltip>
                </span>
              )}
          </div>

          {isSubAction && (
            <div className="flex gap-2">
              <div className="w-[140px]">
                <ScoreDisplay
                  score={actionScores[action.id]?.points_realises ?? null}
                  scoreMax={
                    actionScores[action.id]?.points_max_personnalises ?? null
                  }
                  size="xs"
                />
              </div>

              {displayProgressBar && (
                <div className="flex justify-end w-[155px]">
                  <ActionProgressBar action={action} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu de sélection du statut */}
        <div className="lg:col-span-2 col-span-3">
          {!hideStatus && (
            <ActionStatusDropdown
              action={action}
              actionScores={actionScores}
              onSaveStatus={onSaveStatus}
            />
          )}
        </div>
      </div>
      {displayActionCommentaire && (
        <div onClick={evt => evt.stopPropagation()}>
          <ActionCommentaire
            action={action}
            className="mt-10"
            backgroundClassName="!bg-[#f6f6f6] group-hover:!bg-[#eee]"
          />
        </div>
      )}
    </div>
  );
};

export default SubActionHeader;
