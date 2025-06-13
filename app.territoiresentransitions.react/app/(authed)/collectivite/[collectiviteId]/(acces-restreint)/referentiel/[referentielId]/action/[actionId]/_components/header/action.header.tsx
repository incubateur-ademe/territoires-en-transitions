import { useState } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import { useListMesurePilotes } from '@/app/referentiels/actions/use-mesure-pilotes';
import { useListMesureServicesPilotes } from '@/app/referentiels/actions/use-mesure-services-pilotes';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { Button } from '@/ui';
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
      <div className="flex max-sm:flex-col gap-8 items-start mt-12 mb-3">
        <h1 className="mb-0 text-4xl">
          {action.identifiant} {action.nom}
        </h1>
        {!isReadOnly && (
          <Button
            className="mt-2 ml-auto"
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
      <div className="flex items-center gap-4 my-3 !py-0 text-sm text-grey-7">
        <Score action={action} actionDefinition={actionDefinition} />
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
            Mesure précédente
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
            Mesure suivante
          </Button>
        )}
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
      </div>
    </>
  );
};
