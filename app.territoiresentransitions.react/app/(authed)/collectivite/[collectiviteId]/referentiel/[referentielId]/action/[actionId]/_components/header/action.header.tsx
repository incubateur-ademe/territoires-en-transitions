import { useState } from 'react';

import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionSidePanelToolbar } from '@/app/referentiels/actions/action.side-panel.toolbar';
import { ProgressionRow } from '@/app/referentiels/DEPRECATED_scores.types';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { Button } from '@/ui';
import Breadcrumb from './breadcrumb';
import Score from './score';
import Infos from './infos';
import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';

/**
 * Affiche la partie de l'en-tête de la page Action sensible à la position du
 * défilement vertical
 */
export const ActionHeader = ({
  actionDefinition,
  DEPRECATED_actionScore,
  action,
  nextActionLink,
  prevActionLink,
}: {
  actionDefinition: ActionDefinitionSummary;
  DEPRECATED_actionScore: ProgressionRow;
  action?: ActionDetailed;
  nextActionLink: string | undefined;
  prevActionLink: string | undefined;
}) => {
  const { isReadOnly } = useCurrentCollectivite()!;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      {/** Titre */}
      <div className="flex gap-8 items-start mt-12 mb-3">
        <h1 className="mb-0 text-4xl">
          {actionDefinition.identifiant} {actionDefinition.nom}
        </h1>
        {!isReadOnly && (
          <Button
            className="mt-2"
            variant="grey"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            Modifier
          </Button>
        )}
      </div>

      {/** Breadcrumb */}
      <Breadcrumb action={actionDefinition} />

      {/** Score | Informations | Options */}
      <div className="flex items-center gap-4 my-3 !py-0 text-sm text-grey-7">
        <Score
          action={action}
          actionDefinition={actionDefinition}
          DEPRECATED_actionScore={DEPRECATED_actionScore}
        />
        {action && (
          <Infos
            actionId={action.actionId}
            openState={{
              isOpen: isEditModalOpen,
              setIsOpen: setIsEditModalOpen,
            }}
            isReadOnly={isReadOnly}
          />
        )}
        <ActionSidePanelToolbar action={actionDefinition} />
      </div>

      {/** Action précédente / suivante */}
      <div className="flex justify-between py-2 border-y border-y-primary-3">
        {!!prevActionLink && (
          <Button
            className="border-b-transparent hover:text-primary-9"
            variant="underlined"
            icon="arrow-left-line"
            size="sm"
            href={prevActionLink}
          >
            Action précédente
          </Button>
        )}
        {!!nextActionLink && (
          <Button
            className="ml-auto border-b-transparent hover:text-primary-9"
            variant="underlined"
            icon="arrow-right-line"
            iconPosition="right"
            size="sm"
            href={nextActionLink}
          >
            Action suivante
          </Button>
        )}
        {action && isEditModalOpen && (
          <ActionEditModal
            actionId={action.actionId}
            actionTitle={`${action.identifiant} ${action.nom}`}
            openState={{
              isOpen: isEditModalOpen,
              setIsOpen: setIsEditModalOpen,
            }}
          />
        )}
      </div>
    </>
  );
};
