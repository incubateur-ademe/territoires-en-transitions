import {useEffect, useRef, useState} from 'react';
import {NavLink} from 'react-router-dom';
import classNames from 'classnames';
import {format} from 'date-fns';

import {FicheResume} from '../data/types';
import {generateTitle} from '../data/utils';
import FicheActionBadgeStatut from '../FicheActionForm/FicheActionBadgeStatut';
import FicheActionBadgePriorite from '../FicheActionForm/FicheActionBadgePriorite';
import Titre from './Titre';
import FicheActionSupprimerModal from '../FicheActionSupprimerModal';
import {useDeleteFicheAction} from '../data/useDeleteFicheAction';

type Props = {
  link?: string;
  ficheAction: FicheResume;
  openInNewTab?: boolean;
  /** Pour invalider la liste des fiches d'un axe à la suppression de la fiche */
  axeId?: number;
  /** Pour invalider le plan à la suppression de la fiche */
  planId?: number;
  /** Permet d'afficher le menu d'option de la carte */
  isEditable?: boolean;
};

const FicheActionCard = ({
  openInNewTab,
  ficheAction,
  axeId,
  planId,
  link,
  isEditable = false,
}: Props) => {
  const {mutate: deleteFiche} = useDeleteFicheAction();

  const editButtonRef = useRef<HTMLButtonElement>(null);

  const [isEdit, _setIsEdit] = useState(false);

  /**
   * Fonction permettant d'update la ref afin d'avoir le state à jour
   * dans la fct handleDetectOutsideClick de l'event listener window
   */
  const isEditRef = useRef(isEdit);
  const setIsEdit = (isEdit: boolean) => {
    isEditRef.current = isEdit;
    _setIsEdit(isEdit);
  };

  const carteId = `fiche-${ficheAction.id}`;

  /** Fonction donné à l'event listener pour savoir où l'utilisateur à cliquer */
  const handleDetectOutsideClick = (e: MouseEvent) => {
    // Si l'utilisateur clique en dehors de la carte
    if (!document.getElementById(carteId)?.contains(e.target as Node)) {
      if (isEditRef.current) {
        setIsEdit(false);
      }
    } else {
      if (editButtonRef.current === e.target) {
        setIsEdit(true);
      }
    }
  };

  /** Ajoute et supprime les events listener */
  useEffect(() => {
    window.addEventListener('click', handleDetectOutsideClick);

    return () => {
      window.removeEventListener('click', handleDetectOutsideClick);
    };
  }, []);

  return (
    <div
      data-test="ActionCarte"
      id={carteId}
      className={classNames(
        'relative group h-full border border-gray-200 hover:bg-grey975',
        {'opacity-30': !ficheAction.id}
      )}
    >
      {/** Menu d'options */}
      {isEditable && (
        <div className="absolute top-4 right-4 invisible group-hover:visible !flex">
          {isEdit ? (
            <NavLink
              to={link || '#'}
              target={openInNewTab ? '_blank' : undefined}
              rel={openInNewTab ? 'noopener noreferrer' : undefined}
              className={classNames('!bg-none', {
                'after:!hidden': openInNewTab,
              })}
            >
              <span className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-arrow-right-line" />
            </NavLink>
          ) : (
            <button
              ref={editButtonRef}
              title="Éditer"
              id={`fiche-${ficheAction.id}-edit-button`}
              className={classNames(
                'fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line'
              )}
            />
          )}
          <FicheActionSupprimerModal
            isInMultipleAxes={
              (ficheAction.plans && ficheAction.plans.length > 1) || false
            }
            onDelete={() =>
              deleteFiche({
                ficheId: ficheAction.id!,
                planActionId: planId,
                axeId,
              })
            }
          />
        </div>
      )}
      {/** Carte */}
      <NavLink
        to={link || '#'}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={classNames(
          {'after:!hidden': openInNewTab},
          {'cursor-default': isEdit || !ficheAction.id}
        )}
        onClick={e => isEdit && e.preventDefault()}
      >
        <div className="flex flex-col h-full p-6">
          {(ficheAction.date_fin_provisoire ||
            ficheAction.niveau_priorite ||
            ficheAction.statut) && (
            <div className="flex items-center mb-3">
              {ficheAction.statut && (
                <FicheActionBadgeStatut statut={ficheAction.statut} small />
              )}
              {ficheAction.niveau_priorite && (
                <div
                  title="Priorité"
                  className={classNames({'ml-4': ficheAction.statut})}
                >
                  <FicheActionBadgePriorite
                    priorite={ficheAction.niveau_priorite}
                    small
                  />
                </div>
              )}
              {ficheAction.date_fin_provisoire && (
                <div
                  className={classNames({
                    'ml-4': ficheAction.statut || ficheAction.niveau_priorite,
                  })}
                  title="Échéance"
                >
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {format(
                      new Date(ficheAction.date_fin_provisoire),
                      'dd/MM/yyyy'
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {ficheAction.pilotes && (
            <div className="mb-3 text-sm text-gray-600" title="Pilotes">
              <span className="fr-icon-user-line mr-2 before:!w-4" />
              {ficheAction.pilotes?.map(pilote => pilote.nom).join(' | ')}
            </div>
          )}
          {ficheAction.plans?.length && (
            <div className="mb-3 text-sm text-gray-400" title="Emplacements">
              {ficheAction.plans
                ? ficheAction.plans
                    ?.map(plan => generateTitle(plan?.nom))
                    .join(' | ')
                : 'Fiches non classées'}
            </div>
          )}
          <Titre
            fiche={ficheAction}
            axeId={axeId}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
          />
        </div>
      </NavLink>
    </div>
  );
};

export default FicheActionCard;
