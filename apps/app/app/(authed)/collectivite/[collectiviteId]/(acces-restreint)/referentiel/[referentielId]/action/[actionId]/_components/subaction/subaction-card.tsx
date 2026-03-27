import SubActionPreuvesAccordion from '@/app/referentiels/actions/sub-action/sub-action-preuves.accordion';
import SubActionDescription from '@/app/referentiels/actions/sub-action/sub-action.description';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ActionTypeEnum, StatutAvancementEnum } from '@tet/domain/referentiels';
import { Accordion, Button, Divider } from '@tet/ui';
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
  subAction: ActionListItem;
  isOpen: boolean;
  showJustifications: boolean;
  openCommentPanel: ({ action }: { action: ActionListItem }) => void;
  commentsCount: number;
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
  openCommentPanel,
  commentsCount,
}: SubActionCardProps) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const ref = useRef<HTMLDivElement>(null);

  const [openDetailledModal, setOpenDetailledModal] = useState(false);

  const hash = getHashFromUrl();

  const { statut } = subAction.score;

  const preuvesCount = useActionPreuvesCount(subAction.actionId);

  const taskIds = subAction.childrenIds;

  const [isExpanded, setIsExpanded] = useState(isOpen);

  const isDetailled = statut === StatutAvancementEnum.DETAILLE;

  const isSubAction = subAction.actionType === ActionTypeEnum.SOUS_ACTION;

  useEffect(() => {
    const id = hash;
    if (id.includes(subAction.actionId)) {
      // Scroll jusqu'à la sous-action indiquée dans l'url
      if (id === subAction.actionId && ref && ref.current) {
        setTimeout(() => {
          ref.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
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

        {hasCollectivitePermission('referentiels.mutate') &&
          (isDetailled || subAction.scoreIndicatif) && (
            <Divider className="mt-1 mb-2" />
          )}

        {/* Actions */}
        <SubactionCardActions
          actionId={subAction.actionId}
          haveScoreIndicatif={Boolean(subAction.scoreIndicatif)}
          isDetailled={isDetailled}
          setOpenDetailledModal={setOpenDetailledModal}
        />

        {/* Informations sur les scores indicatifs */}
        <ScoreIndicatifLibelle actionId={subAction.actionId} />
      </div>

      <div
        className={classNames('flex flex-col gap-4', {
          'p-4': showJustifications || isExpanded,
        })}
      >
        {/* Commentaire associé à la sous-action */}
        {showJustifications && (
          <ActionJustificationField
            actionId={subAction.actionId}
            placeholder="Explications sur l'état d'avancement"
          />
        )}

        {/* Infos complémentaires */}
        {isPanelFlagEnabled && preuvesCount > 0 && (
          <div className="mt-auto flex flex-col gap-2">
            <Divider className="mt-auto" />
            <div className="text-xs text-grey-8">
              <span>
                {preuvesCount} document{preuvesCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Section Tâches */}
        {!isPanelFlagEnabled && isExpanded && (
          <>
            {(subAction.description || subAction.exemples !== '') && (
              <Accordion
                id={`Description-${subAction.actionId}`}
                title="Description"
                content={
                  <SubActionDescription
                    subAction={subAction}
                    className="mb-4 mx-2"
                  />
                }
              />
            )}

            {taskIds.length > 0 && (
              <Accordion
                id={`Tâches-${subAction.actionId}`}
                dataTest={`TâchesPanel-${subAction.identifiant}`}
                title="Tâches"
                containerClassname="border-b-0"
                content={<TaskCardsList className="mt-2" taskIds={taskIds} />}
                initialState={isExpanded}
              />
            )}

            <SubActionPreuvesAccordion subAction={subAction} />
          </>
        )}
        {hasCollectivitePermission('referentiels.discussions.read') && (
          <>
            <Divider className="mt-auto" />

            <Button
              variant="underlined"
              size="xs"
              className="text-left border-b-transparent text-grey-6"
              onClick={() => {
                openCommentPanel({ action: subAction });
              }}
            >
              {commentsCount} commentaires
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubActionCard;
