import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionCommentaire } from '@/app/referentiels/actions/action-commentaire';
import {
  StatusToSavePayload,
  SubActionStatutDropdown,
} from '@/app/referentiels/actions/sub-action-statut.dropdown';
import ScoreProgressBar from '@/app/referentiels/scores/score.progress-bar';
import ScoreShow from '@/app/referentiels/scores/score.show';
import { StatutAvancement } from '@/domain/referentiels';
import { Icon, InfoTooltip } from '@/ui';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { useScore, useSnapshotFlagEnabled } from '../../use-snapshot';
import { useScoreRealise } from '../DEPRECATED_useScoreRealise';
import ActionJustification from './sub-action-justification';

type SubActionHeaderProps = {
  actionDefinition: ActionDefinitionSummary;
  actionAvancement?: StatutAvancement;
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
  actionDefinition,
  actionAvancement,
  hideStatus = false,
  statusWarningMessage = false,
  displayProgressBar = false,
  displayActionCommentaire = false,
  openSubAction = false,
  onToggleOpen,
  onSaveStatus,
}: SubActionHeaderProps): JSX.Element => {
  const DEPRECATED_actionScores = useScoreRealise(actionDefinition);
  const NEW_score = useScore(actionDefinition.id);
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();

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
                  <div
                    className="max-w-sm font-normal"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(actionDefinition.description),
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
              {FLAG_isSnapshotEnabled ? (
                <ScoreShow
                  score={NEW_score?.pointFait ?? null}
                  scoreMax={NEW_score?.pointPotentiel ?? null}
                  size="xs"
                />
              ) : (
                <ScoreShow
                  score={
                    DEPRECATED_actionScores[actionDefinition.id]
                      ?.points_realises ?? null
                  }
                  scoreMax={
                    DEPRECATED_actionScores[actionDefinition.id]
                      ?.points_max_personnalises ?? null
                  }
                  size="xs"
                />
              )}
            </div>

            {displayProgressBar && (
              <div className="flex justify-end w-[155px]">
                {/* TODO(temporary): Temporary patch to display percentage */}
                <ScoreProgressBar
                  actionDefinition={actionDefinition}
                  TEMP_displayValue={true}
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
          onSaveStatus={onSaveStatus}
        />
      )}
      {displayActionCommentaire && (
        <div className="col-span-full" onClick={(evt) => evt.stopPropagation()}>
          <ActionCommentaire action={actionDefinition} />
          {actionDefinition.referentiel === 'cae' &&
          actionAvancement === 'detaille' &&
          actionDefinition.children?.length ? (
            <ActionJustification
              action={actionDefinition}
              className="mt-10"
              title="Justification de l’ajustement manuel du score"
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SubActionHeader;
