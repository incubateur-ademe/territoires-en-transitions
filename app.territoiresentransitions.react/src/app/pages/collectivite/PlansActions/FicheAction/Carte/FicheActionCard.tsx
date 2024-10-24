import { FicheResume } from '@tet/api/plan-actions/domain';
import { Button, Card, Notification, Tooltip } from '@tet/ui';
import classNames from 'classnames';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import { useState } from 'react';
import { QueryKey } from 'react-query';
import { useHistory } from 'react-router-dom';
import BadgePriorite from '../../components/BadgePriorite';
import BadgeStatut from '../../components/BadgeStatut';
import { generateTitle } from '../data/utils';
import ModaleSuppression from '../FicheActionDescription/ModaleSuppression';
import { getModifiedSince } from '../utils';
import FicheActionFooterInfo from './FicheActionFooterInfo';
import ModifierFicheModale from './ModifierFicheModale';

type FicheActionCardProps = {
  /** Contenu de la carte fiche action */
  ficheAction: FicheResume;
  /** Lien vers la fiche action */
  link?: string;
  /** Doit ouvrir la fiche action dans un nouvel onglet */
  openInNewTab?: boolean;
  /** Permet d'afficher le menu d'options de la carte */
  isEditable?: boolean;
  /** Pour invalider la liste des fiches d'un axe à la suppression de la fiche */
  axeIdToInvalidate?: number;
  editKeysToInvalidate?: QueryKey[];
  /** Dissociation de la fiche action */
  onUnlink?: () => void;
};

const FicheActionCard = ({
  ficheAction,
  link,
  openInNewTab,
  isEditable = false,
  axeIdToInvalidate,
  editKeysToInvalidate,
  onUnlink,
}: FicheActionCardProps) => {
  const collectivite = useCurrentCollectivite();
  const history = useHistory();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const carteId = `fiche-${ficheAction.id}`;

  const isNotClickable =
    collectivite?.niveau_acces === null && !!ficheAction.restreint;

  return (
    <div className="relative group h-full">
      {/* Menu d'édition et de suppression */}
      {!collectivite?.readonly && (isEditable || onUnlink) && (
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
          {isEditable && (
            <>
              <>
                {isEditOpen && (
                  <ModifierFicheModale
                    initialFiche={ficheAction}
                    axeId={axeIdToInvalidate}
                    isOpen={isEditOpen}
                    setIsOpen={() => setIsEditOpen(!isEditOpen)}
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
                  onClick={() => setIsEditOpen(!isEditOpen)}
                />
              </>
              <ModaleSuppression
                ficheId={ficheAction.id}
                title={ficheAction.titre}
                isInMultipleAxes={
                  !!ficheAction.plans && ficheAction.plans.length > 1
                }
                axeId={axeIdToInvalidate || null}
                keysToInvalidate={editKeysToInvalidate}
              />
            </>
          )}
        </div>
      )}

      {/* Cadenas accès restreint */}
      {ficheAction.restreint && (
        <div
          data-test="FicheCartePrivee"
          title="Fiche en accès restreint"
          className="absolute -top-3 left-5"
        >
          <Notification icon="lock-fill" size="xs" classname="w-7 h-7" />
        </div>
      )}

      {/* Carte */}
      <Card
        dataTest="FicheActionCarte"
        id={carteId}
        className={classNames(
          'h-full px-4 py-[1.125rem] !gap-3 !text-grey-8 !shadow-none transition',
          {
            'hover:border-primary-3 hover:!bg-primary-1': !isNotClickable,
          }
        )}
        onClick={!isNotClickable && link ? () => history.push(link) : undefined}
        disabled={isNotClickable}
        external={openInNewTab}
        header={
          // Badges priorité et statut de la fiche
          (ficheAction.niveauPriorite ||
            ficheAction.statut ||
            ficheAction.actionImpactId) && (
            <div className="flex items-center gap-3">
              {ficheAction.niveauPriorite && (
                <BadgePriorite
                  priorite={ficheAction.niveauPriorite}
                  size="sm"
                />
              )}
              {ficheAction.statut && (
                <BadgeStatut statut={ficheAction.statut} size="sm" />
              )}
              {ficheAction.actionImpactId && (
                <Tooltip label="Action issue du panier d'action">
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
          <div className="flex flex-col gap-3 text-grey-8 font-normal">
            {/* Date de dernière modification */}
            {!!ficheAction.modifiedAt && (
              <span
                className="text-xs font-medium italic"
                title="Dernière modification"
              >
                Modifié {getModifiedSince(ficheAction.modifiedAt)}
              </span>
            )}

            {/* Personnes pilote et date de fin prévisionnelle */}
            <FicheActionFooterInfo
              pilotes={ficheAction.pilotes}
              dateDeFin={ficheAction.dateFinProvisoire}
              ameliorationContinue={ficheAction.ameliorationContinue}
            />
          </div>
        }
      >
        {/* Titre de la fiche action */}
        <span className="text-base font-bold text-primary-9">
          {generateTitle(ficheAction.titre)}
        </span>

        {/* Plans d'action dans lesquels sont la fiche */}
        <span title="Emplacements" className="text-sm font-medium">
          {!!ficheAction.plans && !!ficheAction.plans?.[0] ? (
            <>
              {generateTitle(ficheAction.plans[0].nom)}
              {ficheAction.plans.length > 1 && (
                <Tooltip
                  openingDelay={250}
                  label={
                    <ul className="max-w-xs list-disc list-inside">
                      {ficheAction.plans.map((plan, i) => (
                        <li key={i}>{generateTitle(plan.nom)}</li>
                      ))}
                    </ul>
                  }
                >
                  <span className="ml-1.5 font-medium text-primary-8">
                    +{ficheAction.plans.length - 1}
                  </span>
                </Tooltip>
              )}
            </>
          ) : (
            'Fiche non classée'
          )}
        </span>
      </Card>
    </div>
  );
};

export default FicheActionCard;
