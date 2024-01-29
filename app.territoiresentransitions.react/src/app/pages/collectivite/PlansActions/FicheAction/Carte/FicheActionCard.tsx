import {useEffect, useRef, useState} from 'react';
import {NavLink} from 'react-router-dom';
import classNames from 'classnames';
import {format, isBefore, startOfToday} from 'date-fns';

import {FicheResume} from '../data/types';
import {generateTitle} from '../data/utils';
import BadgeStatut from '../../components/BadgeStatut';
import BadgePriorite from '../../components/BadgePriorite';
import Titre from './Titre';
import FicheActionSupprimerModal from '../FicheActionSupprimerModal';
import {useDeleteFicheAction} from '../data/useDeleteFicheAction';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {Notification} from '@tet/ui';

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
  link,
  isEditable = false,
}: Props) => {
  const collectivite = useCurrentCollectivite();

  const isNotClickable =
    collectivite?.niveau_acces === null && ficheAction.restreint;

  const {mutate: deleteFiche} = useDeleteFicheAction({
    ficheId: ficheAction.id!,
    axeId: axeId || null,
  });

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
        'relative group h-full rounded-xl border border-grey-3',
        {'hover:border-primary-3 hover:bg-primary-1': !isNotClickable}
      )}
    >
      {/** Cadenas accès restreint */}
      {ficheAction.restreint && (
        <div
          data-test="FicheCartePrivee"
          title="Fiche en accès restreint"
          className="absolute -top-5 left-8"
        >
          <Notification icon="lock-fill" />
        </div>
      )}
      {/** Menu d'options */}
      {!collectivite?.readonly && isEditable && (
        <div className="group absolute top-4 right-4 !flex gap-2">
          {isEdit ? (
            <NavLink
              to={link || '#'}
              target={openInNewTab ? '_blank' : undefined}
              rel={openInNewTab ? 'noopener noreferrer' : undefined}
              className={classNames(
                'invisible group-hover:visible !bg-none rounded-lg',
                {
                  'after:!hidden': openInNewTab,
                }
              )}
            >
              <span className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-arrow-right-line !bg-white hover:!bg-primary-3 rounded-lg" />
            </NavLink>
          ) : (
            <button
              data-test="EditerFicheBouton"
              ref={editButtonRef}
              title="Éditer"
              id={`fiche-${ficheAction.id}-edit-button`}
              className={classNames(
                'invisible group-hover:visible fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line !bg-white hover:!bg-primary-3 rounded-lg'
              )}
            />
          )}
          <FicheActionSupprimerModal
            buttonClassname="invisible group-hover:visible !bg-white rounded-lg"
            isInMultipleAxes={
              (ficheAction.plans && ficheAction.plans.length > 1) || false
            }
            onDelete={() => deleteFiche()}
          />
        </div>
      )}
      {/** Carte */}
      <NavLink
        to={link || '#'}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={classNames(
          'block bg-none',
          {'after:!hidden': openInNewTab},
          {'cursor-default': isEdit || !ficheAction.id},
          {
            '!cursor-default, pointer-events-none': isNotClickable,
          }
        )}
        onClick={e => isEdit && e.preventDefault()}
      >
        <div className="flex flex-col gap-3 h-full p-6">
          {(ficheAction.niveau_priorite || ficheAction.statut) && (
            <div className="flex items-center gap-4">
              {ficheAction.statut && (
                <BadgeStatut statut={ficheAction.statut} />
              )}
              {ficheAction.niveau_priorite && (
                <BadgePriorite priorite={ficheAction.niveau_priorite} />
              )}
            </div>
          )}
          <Titre
            fiche={ficheAction}
            axeId={axeId}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
          />
          {ficheAction.plans?.length && (
            <div className="text-sm text-grey-6" title="Emplacements">
              {ficheAction.plans
                ? ficheAction.plans
                    ?.map(plan => generateTitle(plan?.nom))
                    .join(' | ')
                : 'Fiches non classées'}
            </div>
          )}
          {(ficheAction.pilotes || ficheAction.date_fin_provisoire) && (
            <div className="flex items-center gap-4 flex-wrap text-sm text-primary">
              {ficheAction.pilotes && (
                <div className="flex items-start" title="Pilotes">
                  <span className="fr-icon-user-line mr-1.5 before:!w-4" />
                  <span className="mt-0.5">
                    {ficheAction.pilotes?.map(pilote => pilote.nom).join(' | ')}
                  </span>
                </div>
              )}
              {ficheAction.date_fin_provisoire && (
                <>
                  {ficheAction.pilotes && (
                    <div className="w-[1px] h-6 bg-grey-3" />
                  )}
                  <div
                    className={classNames(
                      'flex items-center whitespace-nowrap',
                      {
                        'text-error-1': isBefore(
                          new Date(ficheAction.date_fin_provisoire),
                          startOfToday()
                        ),
                      }
                    )}
                    title="Échéance"
                  >
                    <span className="fr-icon-calendar-line mr-1.5 before:!w-4" />
                    {format(
                      new Date(ficheAction.date_fin_provisoire),
                      'dd/MM/yyyy'
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </NavLink>
    </div>
  );
};

export default FicheActionCard;
