import { useState } from 'react';

import { useCurrentCollectivite } from '@/api/collectivites';
import { BadgeNiveauAcces } from '@/app/app/Layout/Header/BadgeNiveauAcces';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import { useListMesurePilotes } from '@/app/referentiels/actions/use-mesure-pilotes';
import { useListMesureServicesPilotes } from '@/app/referentiels/actions/use-mesure-services-pilotes';
import ActionAuditStatut from '@/app/referentiels/audits/ActionAuditStatut';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { useSticky } from '@/app/utils/useSticky';
import { Badge, Button, Divider } from '@/ui';
import classNames from 'classnames';
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
  const {
    isReadOnly,
    nom: currentCollectiviteName,
    role,
    niveauAcces,
  } = useCurrentCollectivite();

  const { data: pilotes } = useListMesurePilotes(action.actionId);
  const { data: services } = useListMesureServicesPilotes(action.actionId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const headerContainer = useSticky();

  return (
    <div
      ref={headerContainer.ref}
      className={classNames(
        'w-full bg-grey-2 pt-3 -mt-3 z-50 sticky top-0 shadow-none transition-all duration-100',
        {
          'pb-2': !headerContainer.isSticky,
          'pb-0': headerContainer.isSticky,
        }
      )}
    >
      {/* Nom de la collectivité en cours */}
      {headerContainer.isSticky && (
        <div className="flex mb-4">
          <Badge
            title={currentCollectiviteName}
            state={niveauAcces === null ? 'new' : 'info'}
            light
            uppercase={false}
            className="!rounded-r-none border-[0.5px] border-r-0 shrink-0"
            size="sm"
            trim={false}
          />
          <BadgeNiveauAcces
            acces={niveauAcces}
            isAuditeur={role === 'auditeur'}
            className="!rounded-l-none border-[0.5px] border-l-0 shrink-0"
          />
        </div>
      )}

      {/** Titre */}
      <div
        className={classNames('flex gap-4 flex-row items-start', {
          'mb-4': !headerContainer.isSticky,
          'mb-0': headerContainer.isSticky,
        })}
      >
        <h1
          className={classNames('mb-0', {
            'text-4xl': !headerContainer.isSticky,
            'text-2xl': headerContainer.isSticky,
            'leading-7': headerContainer.isSticky,
          })}
        >
          {action.identifiant} {action.nom}
        </h1>
        {!isReadOnly && (
          <Button
            className={classNames('lg:mt-2 lg:ml-auto', {
              hidden: headerContainer.isSticky,
            })}
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
      <div
        className={classNames(
          'flex max-lg:flex-col gap-3 lg:items-center text-sm text-grey-8 border-y border-primary-3',
          {
            'py-3': !headerContainer.isSticky,
            'py-2': headerContainer.isSticky,
          }
        )}
      >
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

          <ActionAuditStatut
            action={actionDefinition}
            className="lg:ml-auto -m-1"
          />
        </div>
      </div>

      {/** Action précédente / suivante */}
      <ActionNavigation
        prevActionLink={prevActionLink}
        nextActionLink={nextActionLink}
        headerIsSticky={headerContainer.isSticky}
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
    </div>
  );
};
