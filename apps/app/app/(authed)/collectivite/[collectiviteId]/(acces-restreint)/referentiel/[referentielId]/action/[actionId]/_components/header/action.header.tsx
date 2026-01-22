import { useState } from 'react';

import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import { useListMesurePilotes } from '@/app/referentiels/actions/use-mesure-pilotes';
import { useListMesureServicesPilotes } from '@/app/referentiels/actions/use-mesure-services-pilotes';
import ActionAuditStatut from '@/app/referentiels/audits/ActionAuditStatut';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { ActionDetailed } from '@/app/referentiels/use-snapshot';
import HeaderSticky from '@/app/ui/layout/HeaderSticky';
import { BadgeNiveauAcces } from '@/app/users/BadgeNiveauAcces';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge, Button, Divider } from '@tet/ui';
import classNames from 'classnames';
import ActionNavigation from './action.navigation';
import { ActionBreadcrumb } from './breadcrum/action.breadcrumb';
import Infos from './infos';
import { Score } from './score';

/**
 * Affiche la partie de l'en-tête de la page Action sensible à la position du
 * défilement vertical
 */
export const ActionHeader = ({
  actionDefinition,
  action,
}: {
  actionDefinition: ActionDefinitionSummary;
  action: ActionDetailed;
}) => {
  const {
    nom: currentCollectiviteName,
    isRoleAuditeur,
    hasCollectivitePermission,
    role,
  } = useCurrentCollectivite();

  const { data: pilotes } = useListMesurePilotes(action.actionId);
  const { data: services } = useListMesureServicesPilotes(action.actionId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canEditReferentiel = hasCollectivitePermission('referentiels.mutate');

  return (
    <HeaderSticky
      render={({ isSticky }) => (
        <div className="w-full bg-grey-2 z-50 sticky top-0 shadow-none transition-all duration-100">
          {/** Titre */}
          <div
            className={classNames(
              'flex flex-col-reverse gap-4 lg:flex-row lg:items-start',
              {
                'pb-3': !isSticky,
                'py-2': isSticky,
              }
            )}
          >
            <h1
              className={classNames('mb-0 leading-tight', {
                'text-4xl': !isSticky,
                'text-2xl': isSticky,
              })}
            >
              {action.identifiant} {action.nom}
            </h1>
            {canEditReferentiel && !isSticky && (
              <Button
                className={classNames('max-lg:hidden mt-2 ml-auto', {
                  'mt-0 !py-1': isSticky,
                })}
                variant="grey"
                size="xs"
                onClick={() => setIsEditModalOpen(true)}
              >
                Modifier
              </Button>
            )}

            {isSticky && (
              <div className="shrink-0 max-lg:hidden flex ml-auto">
                <Badge
                  title={currentCollectiviteName}
                  state={role === null ? 'new' : 'info'}
                  light
                  uppercase={false}
                  className="!rounded-r-none border-[0.5px] border-r-0 shrink-0"
                  size="sm"
                  trim={false}
                />
                <BadgeNiveauAcces
                  acces={role}
                  isAuditeur={isRoleAuditeur}
                  className="!rounded-l-none border-[0.5px] border-l-0 shrink-0"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {/** Breadcrumb */}
            <ActionBreadcrumb action={action} />
            {/* Nom de la collectivité en cours */}
          </div>

          {/** Score | Informations | Options */}
          <div
            className={classNames(
              'flex max-lg:flex-col flex-wrap gap-3 lg:items-center text-sm text-grey-8 border-y border-primary-3',
              {
                'py-3 mt-3': !isSticky,
                'py-1.5 mt-2': isSticky,
              }
            )}
          >
            <Score actionDefinition={actionDefinition} />

            <Divider className="lg:hidden -mb-6" />

            <div className="flex max-sm:flex-col gap-3 sm:items-center w-fit">
              {action && (
                <Infos
                  openState={{
                    isOpen: isEditModalOpen,
                    setIsOpen: setIsEditModalOpen,
                  }}
                  pilotes={pilotes}
                  services={services}
                  isReadOnly={!canEditReferentiel}
                />
              )}
              <ActionAuditStatut
                action={actionDefinition}
                className="lg:ml-auto -m-1"
              />
            </div>
          </div>

          {/** Action précédente / suivante */}
          <ActionNavigation
            actionId={action.actionId}
            headerIsSticky={isSticky}
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
      )}
    />
  );
};
