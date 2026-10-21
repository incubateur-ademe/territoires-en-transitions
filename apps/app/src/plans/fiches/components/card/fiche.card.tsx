import {
  Completion,
  FicheListItem,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { isFicheEditableByCollectiviteUser } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { getFicheActionPlanForCollectivite } from '@/app/plans/fiches/shared/fiche-action-plans.utils';
import FichePrioriteBadge from '@/app/plans/fiches/show-fiche/components/fiche-priorite.badge';
import FicheStatutBadge from '@/app/plans/fiches/show-fiche/components/fiche-statut.badge';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { getModifiedSince } from '@/app/utils/formatUtils';
import { generateTitle } from '@/app/utils/generate-title';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { ActionCard, Button, Checkbox, Tooltip } from '@tet/ui';
import { JSX } from 'react';
import { FicheAccessBadges } from './fiche-access.badges';
import { FicheCardHoverActions } from './fiche-card-hover.actions';
import { FicheCardLinkAction } from './fiche-card-link.action';
import { FicheCompletionStatus } from './fiche.completion';
import { FicheFooter } from './fiche.footer';
import { appLabels } from '@/app/labels/catalog';

type FicheCardBaseProps = {
  /** Contenu de la carte fiche action */
  ficheAction: FicheListItem;
  /** Complétion de la fiche action */
  completion?: Completion;
  completionClassName?: string;
  /** Lien vers la fiche action */
  link?: string;
  /** Doit ouvrir la fiche action dans un nouvel onglet */
  openInNewTab?: boolean;
  /** Permet d'afficher le menu d'options de la carte */
  isEditable?: boolean;
  /** Affiche le bouton "déplacer" */
  isMoveable?: boolean;
  /** Etat sélectionné ou non de la fiche */
  isSelected?: boolean;
  /** Dissociation de la fiche action */
  onUnlink?: () => void;
  /** Exécuté à l'ouverture et à la fermeture de la fiche action */
  onToggleOpen?: (isOpen: boolean) => void;
  /** Id de la collectivité */
  currentCollectivite: CollectiviteCurrent;
  /** Id de l'utilisateur */
  currentUserId: string;
  /** ID du plan pour la mise à jour optimiste de la suppression (optionnel) */
  planId?: number;
  /** ID de l'axe pour la mise à jour optimiste de la suppression (optionnel) */
  axeId?: number;
};

type FicheCardSelectionProps =
  | {
      /** Sélection de la fiche action */
      onSelect?: (isSelected: boolean) => void;
      onToggleLink?: never;
    }
  | {
      onSelect?: never;
      onToggleLink?: () => void;
      onUnlink?: never;
      isEditable?: never;
      isMoveable?: never;
    };

export type FicheCardProps = FicheCardBaseProps & FicheCardSelectionProps;

export const FicheCard = ({
  ficheAction,
  completion,
  link,
  openInNewTab,
  isEditable = false,
  isMoveable = false,
  isSelected = false,
  onUnlink,
  onSelect,
  onToggleLink,
  onToggleOpen,
  currentCollectivite,
  currentUserId,
  planId,
  axeId,
}: FicheCardProps): JSX.Element => {
  const carteId = `fiche-${ficheAction.id}`;

  const collectivitePlans = getFicheActionPlanForCollectivite(
    ficheAction,
    currentCollectivite.collectiviteId
  );

  const isNotClickable =
    !!ficheAction.restreint &&
    !currentCollectivite.hasCollectivitePermission(
      'plans.fiches.read_confidentiel'
    );

  const canUpdate = isFicheEditableByCollectiviteUser(
    ficheAction,
    currentCollectivite,
    currentUserId
  );

  const isSelectable = onSelect !== undefined || onToggleLink !== undefined;
  const hasEditMenu = isEditable && !isSelectable;
  const canShowEditActions =
    canUpdate && (onUnlink !== undefined || hasEditMenu);
  const showsSelectionCheckbox = onSelect !== undefined;
  const toggleSelection = onSelect ? () => onSelect(!isSelected) : onToggleLink;

  const linkAction = onToggleLink && (
    <FicheCardLinkAction isLinked={isSelected} onToggle={onToggleLink} />
  );
  const editActions = canShowEditActions && (
    <FicheCardHoverActions
      ficheAction={ficheAction}
      collectivitePlans={collectivitePlans}
      hasEditMenu={hasEditMenu}
      isMoveable={isMoveable}
      planId={planId}
      axeId={axeId}
      onUnlink={onUnlink}
      onToggleOpen={onToggleOpen}
    />
  );
  const hoverActions = linkAction || editActions;

  return (
    <article id={carteId} className="relative h-full">
      <ActionCard
        hoverActions={hoverActions}
        href={isSelectable || isNotClickable ? undefined : link}
        onClick={toggleSelection}
        disabled={isNotClickable}
        isSelected={isSelectable ? isSelected : undefined}
        external={openInNewTab}
        header={
          (ficheAction.priorite ||
            ficheAction.statut ||
            ficheAction.actionImpactId) && (
            <div className="flex items-center gap-3">
              {ficheAction.priorite && (
                <FichePrioriteBadge priorite={ficheAction.priorite} size="sm" />
              )}
              {ficheAction.statut && (
                <FicheStatutBadge statut={ficheAction.statut} size="sm" />
              )}
              {ficheAction.actionImpactId && (
                <Tooltip label={appLabels.actionIssueActionsAImpact}>
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
          <div className="flex flex-col gap-2 font-normal">
            <FicheFooter
              pilotes={ficheAction.pilotes}
              dateDeFin={ficheAction.dateFin}
              services={ficheAction.services}
              ameliorationContinue={ficheAction.ameliorationContinue}
            />

            {(ficheAction.modifiedAt || completion) && (
              <>
                <div className="h-[0.5px] w-full bg-primary-3 mt-1" />
                <div className="flex max-md:flex-col gap-3 items-center">
                  {!!ficheAction.modifiedAt && (
                    <span
                      className="text-xs font-medium italic text-grey-6"
                      title={appLabels.ficheDerniereModification}
                    >
                      {appLabels.modifie}{' '}
                      {getModifiedSince(ficheAction.modifiedAt)}
                    </span>
                  )}
                  {completion && (
                    <>
                      {!!ficheAction.modifiedAt && (
                        <div className="max-md:hidden w-px h-5 bg-grey-5" />
                      )}
                      <FicheCompletionStatus
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
        <div className="flex min-w-min">
          {showsSelectionCheckbox && <Checkbox checked={isSelected} />}
          <span className="text-base font-bold text-primary-9">
            {generateTitle(ficheAction.titre)}
          </span>
        </div>

        <span
          title={appLabels.ficheEmplacements}
          className="text-sm font-medium"
        >
          {collectivitePlans.length > 0 ? (
            <ListWithTooltip
              list={collectivitePlans.map((p) => generateTitle(p.nom))}
            />
          ) : (
            appLabels.actionNonClassee
          )}
        </span>
      </ActionCard>

      <FicheAccessBadges
        ficheAction={ficheAction}
        collectiviteId={currentCollectivite.collectiviteId}
      />
    </article>
  );
};
