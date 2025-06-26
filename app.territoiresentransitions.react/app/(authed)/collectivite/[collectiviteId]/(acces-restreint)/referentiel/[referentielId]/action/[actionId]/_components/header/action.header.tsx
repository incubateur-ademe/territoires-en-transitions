import { useState } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import { useListMesurePilotes } from '@/app/referentiels/actions/use-mesure-pilotes';
import { useListMesureServicesPilotes } from '@/app/referentiels/actions/use-mesure-services-pilotes';
import ActionAuditStatut from '@/app/referentiels/audits/ActionAuditStatut';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { Button, Divider } from '@/ui';
import ActionNavigation from './action.navigation';
import Breadcrumb from './breadcrumb';
import Infos from './infos';
import Score from './score';

/**
 * Affiche la partie de l'en-tête de la page Action sensible à la position du
 * défilement vertical
 */
export const ActionHeader = ({
  actionDefinition,
  action,
  nextActionLink,
  prevActionLink,
}: {
  actionDefinition: ActionDefinitionSummary;
  action: ActionDetailed;
  nextActionLink: string | undefined;
  prevActionLink: string | undefined;
}) => {
  const { isReadOnly } = useCurrentCollectivite();

  const { data: pilotes } = useListMesurePilotes(action.actionId);
  const { data: services } = useListMesureServicesPilotes(action.actionId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      {/** Titre */}
      <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start mt-12 mb-4">
        <h1 className="mb-0 md:text-4xl">
          {action.identifiant} {action.nom}
        </h1>
        {!isReadOnly && (
          <Button
            className="lg:mt-2 ml-auto"
            variant="grey"
            size="xs"
            onClick={() => setIsEditModalOpen(true)}
          >
            Modifier
          </Button>
        )}
      </div>

      {/** Breadcrumb */}
      <Breadcrumb action={action} />

      {/** Score | Informations | Options */}
      <div className="flex max-lg:flex-col gap-3 lg:items-center py-3 text-sm text-grey-8 border-y border-primary-3">
        <Score action={action} actionDefinition={actionDefinition} />

        <Divider className="lg:hidden -mb-6" />

        <div className="flex max-sm:flex-col gap-3 sm:items-center w-full">
          {action && (
            <Infos
              openState={{
                isOpen: isEditModalOpen,
                setIsOpen: setIsEditModalOpen,
              }}
              pilotes={pilotes}
              services={services}
              isReadOnly={isReadOnly}
            />
          )}
          <div className="w-[0.5px] h-5 bg-grey-5 max-sm:hidden lg:hidden" />

          <ActionAuditStatut action={actionDefinition} className="lg:ml-auto" />
        </div>
      </div>

      {/** Action précédente / suivante */}
      <ActionNavigation
        prevActionLink={prevActionLink}
        nextActionLink={nextActionLink}
      />

      {/* Modale d'édition rapide */}
      {action && isEditModalOpen && (
        <ActionEditModal
          actionId={action.actionId}
          actionTitle={`${action.identifiant} ${action.nom}`}
          pilotes={pilotes}
          services={services}
          openState={{
            isOpen: isEditModalOpen,
            setIsOpen: setIsEditModalOpen,
          }}
        />
      )}
    </>
  );
};
