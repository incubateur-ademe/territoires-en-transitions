import {Fragment, useState} from 'react';
import {NavLink} from 'react-router-dom';
import {QueryKey} from 'react-query';
import classNames from 'classnames';
import {format, isBefore, startOfToday} from 'date-fns';
import {fr} from 'date-fns/locale';
import {Button, Icon, Notification, Tooltip} from '@tet/ui';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {FicheResume} from '../data/types';
import {generateTitle} from '../data/utils';
import BadgeStatut from '../../components/BadgeStatut';
import BadgePriorite from '../../components/BadgePriorite';
import ModifierFicheModale from './ModifierFicheModale';
import ModaleSuppression from '../../FicheActionNew/FicheActionDescription/ModaleSuppression';
import {getModifiedSince} from '../../FicheActionNew/utils';

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
};

const FicheActionCard = ({
  ficheAction,
  link,
  openInNewTab,
  isEditable = false,
  axeIdToInvalidate,
  editKeysToInvalidate,
}: FicheActionCardProps) => {
  const collectivite = useCurrentCollectivite();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const carteId = `fiche-${ficheAction.id}`;

  const isNotClickable =
    collectivite?.niveau_acces === null && ficheAction.restreint;

  const isLate =
    ficheAction.date_fin_provisoire &&
    isBefore(new Date(ficheAction.date_fin_provisoire), startOfToday());

  return (
    <div
      data-test="ActionCarte"
      id={carteId}
      className={classNames(
        'relative group h-full rounded-xl border border-grey-3 bg-white',
        {
          'hover:border-primary-3 hover:bg-primary-1 transition':
            !isNotClickable,
        }
      )}
    >
      {/* Cadenas accès restreint */}
      {ficheAction.restreint && (
        <div
          data-test="FicheCartePrivee"
          title="Fiche en accès restreint"
          className="absolute -top-4 left-5"
        >
          <Notification icon="lock-fill" size="xs" classname="!p-1.5" />
        </div>
      )}

      {/* Menu d'édition et de suppression */}
      {!collectivite?.readonly && isEditable && (
        <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
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
            buttonVariant="grey"
          />
        </div>
      )}

      {/* Carte */}
      <NavLink
        to={link || ''}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={classNames(
          'block bg-none h-full',
          {'after:!hidden': openInNewTab},
          {'cursor-default': !ficheAction.id},
          {
            '!cursor-default pointer-events-none': isNotClickable,
          }
        )}
        onClick={e => isNotClickable && e.preventDefault()}
      >
        {/* Contenu de la carte */}
        <div className="h-full px-4 py-[1.125rem] flex flex-col gap-3 text-grey-8">
          {/* Badges priorité et statut de la fiche */}
          {(ficheAction.niveau_priorite || ficheAction.statut) && (
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
          )}

          {/* Titre de la fiche action */}
          <span className="text-base font-bold text-primary-9">
            {generateTitle(ficheAction.titre)}
          </span>

          {/* Plans d'action dans lesquels sont la fiche */}
          <span title="Emplacements" className="text-sm font-medium">
            {ficheAction.plans && ficheAction.plans.length > 0 ? (
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
              'Fiches non classées'
            )}
          </span>

          {/* Bas de carte */}
          <div className="mt-auto flex flex-col gap-3">
            {/* Date de dernière modification */}
            <span
              className="text-xs font-medium italic"
              title="Dernière modification"
            >
              Modifié {getModifiedSince(ficheAction.modified_at!)}
            </span>

            {/* Personnes pilote et date de fin prévisionnelle */}
            {(ficheAction.pilotes?.length ||
              ficheAction.date_fin_provisoire) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {/* Personnes pilote */}
                {ficheAction.pilotes && ficheAction.pilotes.length > 0 && (
                  <span title="Pilotes">
                    <Icon icon="user-line" size="sm" className="mr-1" />
                    {ficheAction.pilotes[0].nom}
                    {ficheAction.pilotes.length > 1 && (
                      <Tooltip
                        openingDelay={250}
                        label={
                          <ul className="max-w-xs list-disc list-inside">
                            {ficheAction.pilotes.map((pilote, i) => (
                              <li key={i}>{pilote.nom}</li>
                            ))}
                          </ul>
                        }
                      >
                        <span className="ml-1.5 font-medium text-primary-8">
                          +{ficheAction.pilotes.length - 1}
                        </span>
                      </Tooltip>
                    )}
                  </span>
                )}

                {/* Date de fin provisoire */}
                {ficheAction.date_fin_provisoire && (
                  <Fragment>
                    {ficheAction.pilotes && ficheAction.pilotes.length > 0 && (
                      <div className="w-[1px] h-4 bg-grey-5" />
                    )}
                    <span
                      title="Échéance"
                      className={classNames({'text-error-1': isLate})}
                    >
                      <Icon icon="calendar-line" size="sm" className="mr-1" />
                      {format(
                        new Date(ficheAction.date_fin_provisoire),
                        'dd MMMM yyyy',
                        {locale: fr}
                      )}
                    </span>
                  </Fragment>
                )}
              </div>
            )}
          </div>
        </div>
      </NavLink>
    </div>
  );
};

export default FicheActionCard;
