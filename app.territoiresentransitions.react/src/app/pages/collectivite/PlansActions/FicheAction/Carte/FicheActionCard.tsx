import {useState} from 'react';
import {QueryKey} from 'react-query';
import classNames from 'classnames';
import {Button, Card, Notification, Tooltip} from '@tet/ui';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {FicheResume} from '../data/types';
import {generateTitle} from '../data/utils';
import BadgeStatut from '../../components/BadgeStatut';
import BadgePriorite from '../../components/BadgePriorite';
import ModifierFicheModale from './ModifierFicheModale';
import ModaleSuppression from '../FicheActionDescription/ModaleSuppression';
import {getModifiedSince} from '../utils';
import FicheActionFooterInfo from './FicheActionFooterInfo';

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

  const [isEditOpen, setIsEditOpen] = useState(false);

  const carteId = `fiche-${ficheAction.id}`;

  const isNotClickable =
    collectivite?.niveau_acces === null && ficheAction.restreint;

  return (
    <div className="relative group">
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
          className="absolute -top-3.5 left-5"
        >
          <Notification icon="lock-fill" size="xs" classname="!p-1.5" />
        </div>
      )}

      {/* Carte */}
      <Card
        data-test="ActionCarte"
        id={carteId}
        className={classNames(
          'h-full px-4 py-[1.125rem] !gap-3 !text-grey-8 !shadow-none transition',
          {
            'hover:border-primary-3 hover:!bg-primary-1': !isNotClickable,
          }
        )}
        href={!isNotClickable && link ? link : undefined}
        disabled={isNotClickable}
        external={openInNewTab}
        header={
          // Badges priorité et statut de la fiche
          (ficheAction.niveau_priorite || ficheAction.statut) && (
            <div className="flex items-center gap-3">
              {ficheAction.niveau_priorite && (
                <BadgePriorite
                  priorite={ficheAction.niveau_priorite}
                  size="sm"
                />
              )}
              {ficheAction.statut && (
                <BadgeStatut statut={ficheAction.statut} size="sm" />
              )}
            </div>
          )
        }
        footer={
          // Bas de la carte
          <div className="flex flex-col gap-3 text-grey-8 font-normal">
            {/* Date de dernière modification */}
            {!!ficheAction.modified_at && (
              <span
                className="text-xs font-medium italic"
                title="Dernière modification"
              >
                Modifié {getModifiedSince(ficheAction.modified_at)}
              </span>
            )}

            {/* Personnes pilote et date de fin prévisionnelle */}
            <FicheActionFooterInfo
              pilotes={ficheAction.pilotes}
              dateDeFin={ficheAction.date_fin_provisoire}
              ameliorationContinue={ficheAction.amelioration_continue}
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
          {!!ficheAction.plans && ficheAction.plans.length > 0 ? (
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
