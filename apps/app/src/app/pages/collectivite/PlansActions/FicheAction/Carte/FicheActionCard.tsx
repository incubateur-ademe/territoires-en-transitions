import { Completion } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import {
  getFicheActionShareIcon,
  getFicheActionShareText,
} from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { isFicheEditableByCollectiviteUser } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import DeleteOrRemoveFicheSharingModal from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import { getFicheActionPlanForCollectivite } from '@/app/plans/fiches/shared/fiche-action-plans.utils';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { getModifiedSince } from '@/app/utils/formatUtils';
import { FicheResume } from '@/domain/plans';
import { CollectiviteAccess } from '@/domain/users';
import { Button, Card, Checkbox, Notification, Tooltip } from '@/ui';
import { QueryKey } from '@tanstack/react-query';
import classNames from 'classnames';
import { useState } from 'react';
import BadgePriorite from '../../components/BadgePriorite';
import BadgeStatut from '../../components/BadgeStatut';
import { generateTitle } from '../data/utils';
import { FicheActionCompletionStatus } from '../FicheActionCompletion/fiche-action-completion';
import FicheActionFooterInfo from './FicheActionFooterInfo';
import ModifierFicheModale from './ModifierFicheModale';

export type FicheActionCardProps = {
  /** Contenu de la carte fiche action */
  ficheAction: FicheResume;
  /** Complétion de la fiche action */
  completion?: Completion;
  completionClassName?: string;
  /** Lien vers la fiche action */
  link?: string;
  /** Doit ouvrir la fiche action dans un nouvel onglet */
  openInNewTab?: boolean;
  /** Permet d'afficher le menu d'options de la carte */
  isEditable?: boolean;
  editKeysToInvalidate?: QueryKey[];
  /** Etat sélectionné ou non de la fiche */
  isSelected?: boolean;
  /** Dissociation de la fiche action */
  onUnlink?: () => void;
  /** Sélection de la fiche action */
  onSelect?: (isSelected: boolean) => void;
  /** Exécuté à l'ouverture et à la fermeture de la fiche action */
  onToggleOpen?: (isOpen: boolean) => void;
  /** Id de la collectivité */
  currentCollectivite: CollectiviteAccess;
  /** Id de l'utilisateur */
  currentUserId: string;
};

const FicheActionCard = ({
  ficheAction,
  completion,
  link,
  openInNewTab,
  isEditable = false,
  editKeysToInvalidate,
  isSelected = false,
  onUnlink,
  onSelect,
  onToggleOpen,
  currentCollectivite,
  currentUserId
}: FicheActionCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const carteId = `fiche-${ficheAction.id}`;

  const collectivitePlans = getFicheActionPlanForCollectivite(
    ficheAction,
    currentCollectivite.collectiviteId
  );
  const isNotClickable =
    currentCollectivite.niveauAcces === null && !!ficheAction.restreint;

  const canUpdate = isFicheEditableByCollectiviteUser(ficheAction, currentCollectivite, currentUserId);

  const toggleOpen = (isOpen: boolean) => {
    setIsEditOpen(isOpen);
    onToggleOpen?.(isOpen);
  };

  return (
    <div className="relative group h-full">
      {/* Menu d'édition et de suppression */}
      {!currentCollectivite.isReadOnly && (isEditable || onUnlink) && (
        <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
          {onUnlink && (
            <Button
              icon="link-unlink"
              title="Dissocier la fiche action"
              variant="grey"
              size="xs"
              onClick={onUnlink}
            />
          )}
          {isEditable && canUpdate && !onSelect && (
            <>
              <>
                {isEditOpen && (
                  <ModifierFicheModale
                    initialFiche={ficheAction}
                    isOpen={isEditOpen}
                    setIsOpen={() => toggleOpen(!isEditOpen)}
                    keysToInvalidate={editKeysToInvalidate}
                  />
                )}
                <Button
                  data-test="EditerFicheBouton"
                  id={`fiche-${ficheAction.id}-edit-button`}
                  icon="edit-line"
                  title="Modifier la fiche"
                  variant="grey"
                  size="xs"
                  onClick={() => toggleOpen(!isEditOpen)}
                />
              </>
              <DeleteOrRemoveFicheSharingModal
                fiche={ficheAction}
                permissions={currentCollectivite.permissions}
              />
            </>
          )}
        </div>
      )}

      {/* Cadenas accès restreint */}
      {(ficheAction.restreint ||
        ficheAction.sharedWithCollectivites?.length) && (
        <div className="absolute -top-3 left-5 flex items-center gap-1">
          {ficheAction.restreint && (
            <div data-test="FicheCartePrivee" title="Fiche en accès restreint">
              <Notification icon="lock-fill" size="xs" classname="w-7 h-7" />
            </div>
          )}
          {ficheAction.sharedWithCollectivites?.length && (
            <div
              data-test="FicheCartePrivee"
              title={getFicheActionShareText(
                ficheAction,
                currentCollectivite.collectiviteId
              )}
            >
              <Notification
                icon={getFicheActionShareIcon(
                  ficheAction,
                  currentCollectivite.collectiviteId
                )}
                variant="success"
                size="xs"
                classname="w-7 h-7"
              />
            </div>
          )}
        </div>
      )}

      {/* Carte */}
      <Card
        dataTest="FicheActionCarte"
        id={carteId}
        className={classNames(
          'h-full !p-4 !gap-2 !text-grey-8 !shadow-none transition',
          {
            'hover:border-primary-3 hover:!bg-primary-1': !isNotClickable,
          }
        )}
        href={onSelect ? undefined : link}
        onClick={onSelect ? () => onSelect(!isSelected) : undefined}
        disabled={isNotClickable}
        isSelected={isSelected}
        external={openInNewTab}
        header={
          // Badges priorité et statut de la fiche
          (ficheAction.priorite ||
            ficheAction.statut ||
            ficheAction.actionImpactId) && (
            <div className="flex items-center gap-3">
              {ficheAction.priorite && (
                <BadgePriorite priorite={ficheAction.priorite} size="sm" />
              )}
              {ficheAction.statut && (
                <BadgeStatut statut={ficheAction.statut} size="sm" />
              )}
              {ficheAction.actionImpactId && (
                <Tooltip label="Fiche action issue du service Actions à Impact">
                  <Button
                    variant="outlined"
                    size="xs"
                    className="bg-primary-2 text-center border-none !p-1"
                    icon="shopping-basket-2-line"
                  />
                </Tooltip>
              )}
            </div>
          )
        }
        footer={
          // Bas de la carte
          <div className="flex flex-col gap-2 font-normal">
            {/* Personnes pilote et date de fin prévisionnelle */}
            <FicheActionFooterInfo
              pilotes={ficheAction.pilotes}
              dateDeFin={ficheAction.dateFin}
              services={ficheAction.services}
              ameliorationContinue={ficheAction.ameliorationContinue}
            />

            {(ficheAction.modifiedAt || completion) && (
              <>
                <div className="h-[0.5px] w-full bg-primary-3 mt-1" />
                <div className="flex max-md:flex-col gap-3 items-center">
                  {/* Date de dernière modification */}
                  {!!ficheAction.modifiedAt && (
                    <span
                      className="text-xs font-medium italic text-grey-6"
                      title="Dernière modification"
                    >
                      Modifié {getModifiedSince(ficheAction.modifiedAt)}
                    </span>
                  )}
                  {/* Complétion */}
                  {completion && (
                    <>
                      {!!ficheAction.modifiedAt && (
                        <div className="max-md:hidden w-px h-5 bg-grey-5" />
                      )}
                      <FicheActionCompletionStatus
                        completion={completion}
                        className="text-xs text-grey-6"
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        }
      >
        {/* Titre de la fiche action */}
        <div className="flex min-w-min">
          {onSelect && <Checkbox checked={isSelected} />}
          <span className="text-base font-bold text-primary-9">
            {generateTitle(ficheAction.titre)}
          </span>
        </div>

        {/* Plans d'action dans lesquels sont la fiche */}
        <span title="Emplacements" className="text-sm font-medium">
          {collectivitePlans.length > 0 ? (
            <ListWithTooltip
              list={collectivitePlans.map((p) => generateTitle(p.nom))}
            />
          ) : (
            'Fiche non classée'
          )}
        </span>
      </Card>
    </div>
  );
};

export default FicheActionCard;
