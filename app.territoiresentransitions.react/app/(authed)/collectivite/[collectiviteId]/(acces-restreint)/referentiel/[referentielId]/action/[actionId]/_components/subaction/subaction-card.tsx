import { useCurrentCollectivite } from '@/api/collectivites';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import SubActionPreuvesAccordion from '@/app/referentiels/actions/sub-action/sub-action-preuves.accordion';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { ActionTypeEnum } from '@/domain/referentiels';
import { Accordion, Divider } from '@/ui';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { ActionJustificationField } from '../action/action.justification-field';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import TaskCardsList from '../task/task.cards-list';
import SubactionCardActions from './subaction-card.actions';
import { SubactionCardHeader } from './subaction-card.header';

export const getHashFromUrl = () => {
  // Only run on client side since window is not available on server
  if (typeof window !== 'undefined') {
    // Get everything after # symbol, removing the # itself
    const hash = window.location.hash.slice(1);
    return hash;
  }

  return '';
};

type SubActionCardProps = {
  subAction: ActionDefinitionSummary;
  isOpen: boolean;
  showJustifications: boolean;
  onClick: () => void;
};

/**
 * Carte permettant l'affichage d'une sous-action
 * dans l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "Etat des lieux"
 */

const SubActionCard = ({
  subAction,
  isOpen,
  showJustifications,
  onClick,
}: SubActionCardProps) => {
  const { isReadOnly } = useCurrentCollectivite();

  const ref = useRef<HTMLDivElement>(null);

  const [openDetailledModal, setOpenDetailledModal] = useState(false);

  const hash = getHashFromUrl();

  const { statut, filled } = useActionStatut(subAction.id);
  const { avancement } = statut || {};

  const preuvesCount = useActionPreuvesCount(subAction.id);

  const tasks = useActionSummaryChildren(subAction);

  const [isExpanded, setIsExpanded] = useState(isOpen);

  const shouldHideTasksStatus =
    statut?.concerne === false ||
    (statut !== null &&
      avancement !== 'non_renseigne' &&
      avancement !== 'detaille') ||
    (statut !== null && avancement === 'detaille');

  const isDetailled =
    avancement === 'detaille' ||
    (avancement === 'non_renseigne' && filled === true) ||
    (statut === null && filled === true);

  const isSubAction = subAction.type === ActionTypeEnum.SOUS_ACTION;

  useEffect(() => {
    const id = hash.slice(1); // enlève le "#" au début du hash

    if (id.includes(subAction.id)) {
      // Scroll jusqu'à la sous-action indiquée dans l'url
      if (id === subAction.id && ref && ref.current) {
        setTimeout(() => {
          ref.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }, 0);
      }
    }
  }, [hash, ref]);

  const isPanelFlagEnabled = false;

  return (
    <div
      ref={ref}
      data-test={`SousAction-${subAction.identifiant}`}
      className={classNames(
        'flex flex-col bg-grey-1 transition-colors border border-grey-3 rounded-lg',
        { 'hover:bg-grey-2': !isExpanded }
      )}
    >
      {/* En-tête */}
      <div
        className={classNames('p-4', {
          'bg-primary-1 hover:bg-primary-1 border-primary-3': isExpanded,
          'cursor-pointer': isSubAction,
        })}
        onClick={() => {
          setIsExpanded(!isExpanded);
          onClick();
        }}
      >
        <SubactionCardHeader
          subAction={subAction}
          openDetailledState={{
            isOpen: openDetailledModal,
            setIsOpen: setOpenDetailledModal,
          }}
          isExpanded={isExpanded}
        />

        {!isReadOnly && (isDetailled || subAction.haveScoreIndicatif) && (
          <Divider color="light" className="-mb-4 mt-1" />
        )}

        {/* Actions */}
        <SubactionCardActions
          actionId={subAction.id}
          haveScoreIndicatif={subAction.haveScoreIndicatif}
          isDetailled={isDetailled}
          setOpenDetailledModal={setOpenDetailledModal}
        />

        {/* Informations sur les scores indicatifs */}
        <ScoreIndicatifLibelle actionId={subAction.id} />
      </div>

      <div
        className={classNames('flex flex-col gap-4', {
          'p-4': showJustifications || isExpanded,
        })}
      >
        {/* Commentaire associé à la sous-action */}
        {showJustifications && (
          <ActionJustificationField
            actionId={subAction.id}
            placeholder="Explications sur l'état d'avancement"
          />
        )}

        {/* Infos complémentaires */}
        {isPanelFlagEnabled && preuvesCount > 0 && (
          <div className="mt-auto flex flex-col gap-2">
            <Divider color="light" className="-mb-6 mt-auto" />
            <div className="text-xs text-grey-8">
              <span>
                {preuvesCount} document{preuvesCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Section Tâches */}
        {!isPanelFlagEnabled && isExpanded && tasks.length > 0 && (
          <Accordion
            id={`Tâches-${subAction.id}`}
            dataTest={`TâchesPanel-${subAction.identifiant}`}
            containerClassname=""
            title="Tâches"
            content={
              <TaskCardsList
                className="mt-2"
                tasks={tasks}
                hideStatus={shouldHideTasksStatus}
              />
            }
            initialState={isExpanded}
          />
        )}

        {!isPanelFlagEnabled && isExpanded && (
          <SubActionPreuvesAccordion subAction={subAction} />
        )}
      </div>
    </div>
  );
};

export default SubActionCard;
