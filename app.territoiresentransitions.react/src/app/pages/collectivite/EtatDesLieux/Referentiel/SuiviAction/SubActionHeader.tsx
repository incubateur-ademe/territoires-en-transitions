import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useEffect, useState} from 'react';
import {
  ActionStatusDropdown,
  StatusToSavePayload,
} from 'ui/referentiels/ActionStatusDropdown';
import ScoreDisplay from 'ui/referentiels/ScoreDisplay';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {SuiviScoreRow} from '../data/useScoreRealise';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import {ExpandToggle} from 'ui/icons/ExpandToggle';
import ActionJustification from 'app/pages/collectivite/EtatDesLieux/Referentiel/SuiviAction/ActionJustification';
import {TActionAvancement} from 'types/alias';
import {InfoTooltip} from '@tet/ui';
import DOMPurify from 'dompurify';

type SubActionHeaderProps = {
  action: ActionDefinitionSummary;
  actionScores: {[actionId: string]: SuiviScoreRow};
  actionAvancement?: TActionAvancement;
  hideStatus?: boolean;
  statusWarningMessage?: boolean;
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
  actionAvancement,
  hideStatus = false,
  statusWarningMessage = false,
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
        {isSubAction && <ExpandToggle open={open} />}
        {action.identifiant}
      </div>

      {/* Nom de l'action et score réalisé */}
      <div className="flex flex-col justify-between gap-3">
        <div className={classNames({'font-bold': isSubAction})}>
          {action.nom}
          {action.description &&
            ((isSubAction && action.referentiel === 'cae') || isTask) && (
              <InfoTooltip
                label={
                  <div
                    className="max-w-sm font-normal"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(action.description),
                    }}
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
      {!hideStatus && (
        <ActionStatusDropdown
          action={action}
          actionScores={actionScores}
          statusWarningMessage={statusWarningMessage}
          onSaveStatus={onSaveStatus}
        />
      )}
      {displayActionCommentaire && (
        <div className="col-span-full" onClick={evt => evt.stopPropagation()}>
          <ActionCommentaire
            action={action}
            backgroundClassName="!bg-[#f6f6f6] group-hover:!bg-[#eee]"
          />
          {action.referentiel === 'cae' &&
          actionAvancement === 'detaille' &&
          action.children?.length ? (
            <ActionJustification
              action={action}
              className="mt-10"
              backgroundClassName="!bg-[#f6f6f6] group-hover:!bg-[#eee]"
              title="Justification de l’ajustement manuel du score"
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SubActionHeader;
