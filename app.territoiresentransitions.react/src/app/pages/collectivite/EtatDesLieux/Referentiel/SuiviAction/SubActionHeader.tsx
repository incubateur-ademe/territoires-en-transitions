import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useEffect, useState} from 'react';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {ActionStatusDropdown} from 'ui/referentiels/ActionStatusDropdown';
import {Tooltip} from 'ui/shared/floating-ui/Tooltip';
import ScoreDisplay from 'app/pages/collectivite/EtatDesLieux/Referentiel/SuiviAction/ScoreDisplay';
import {useActionScore} from 'core-logic/hooks/scoreHooks';

type SubActionHeaderProps = {
  action: ActionDefinitionSummary;
  openSubAction?: boolean;
  withStatusDropdown?: boolean; // param provisoire, à enlever
  // quand toutes les sous-actions auront un statusDropdown
  onToggleOpen?: () => void;
};

/**
 * En-tête des sous-actions / tâches dans le suivi de l'action
 */

const SubActionHeader = ({
  action,
  openSubAction = false,
  withStatusDropdown = false,
  onToggleOpen,
}: SubActionHeaderProps): JSX.Element => {
  const [open, setOpen] = useState(openSubAction);
  const isSubAction = action.type === 'sous-action';
  const isTask = action.type === 'tache';

  // Appel provisoire en attendant d'avoir le
  // select du statut à la sous-action
  const score = useActionScore(action.id);

  useEffect(() => setOpen(openSubAction), [openSubAction]);

  const handleOnClick = () => {
    setOpen(prevState => !prevState);
    if (onToggleOpen) onToggleOpen();
  };

  return (
    <div
      className={classNames('grid grid-cols-12 gap-4 items-start py-4', {
        'rounded-lg cursor-pointer px-6': isSubAction,
        'px-0': isTask,
        'bg-[#f5f5fE]': isSubAction && open,
        'hover:bg-grey975': isSubAction && !open,
      })}
      onClick={handleOnClick}
    >
      {/* Identifiant de l'action et bouton open / close */}
      <div
        className={classNames('flex justify-between', {
          'font-bold': isSubAction,
        })}
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
      <div className="col-span-9 flex flex-col gap-3">
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

        {isSubAction && <ScoreDisplay action={action} size="xs" />}
      </div>

      {/* Jauge de progression / Menu de sélection du statut */}
      <div className="col-span-2">
        {/* Conditions provisoires à enlever lorsque le statut à la sous-action sera possible */}

        {/* Si sous-action contenant des tâches (withStatusDropdown === false)
        et ayant un score potentiel défini et >= 1e-3
        ==> Affichage de la progress bar  */}

        {/* Si tâche
        ou sous-action sans tâche (withStatusDropdown === true)
        ou avec des tâches mais score potentiel non défini ou < 1e-3
        ==> Affichage du dropdown de sélection de statut */}

        {/* Si sous-action contenant des tâches et avec statut "non concerné"
        ==> Dropdown disabled */}

        {isSubAction &&
        !withStatusDropdown &&
        score?.point_potentiel !== undefined &&
        score.point_potentiel >= 1e-3 ? (
          <ActionProgressBar actionId={action.id} />
        ) : isTask ||
          (isSubAction &&
            (withStatusDropdown ||
              score === null ||
              (score?.point_potentiel !== undefined &&
                score.point_potentiel < 1e-3))) ? (
          <ActionStatusDropdown
            actionId={action.id}
            isDisabled={
              isSubAction &&
              (score === null ||
                (score?.point_potentiel !== undefined &&
                  score.point_potentiel < 1e-3)) &&
              !withStatusDropdown
            }
          />
        ) : null}
      </div>
    </div>
  );
};

export default SubActionHeader;
