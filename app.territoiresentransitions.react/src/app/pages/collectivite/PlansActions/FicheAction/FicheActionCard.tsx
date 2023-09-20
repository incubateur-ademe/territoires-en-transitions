import {NavLink} from 'react-router-dom';
import classNames from 'classnames';
import {FicheResume} from './data/types';
import {generateTitle} from './data/utils';
import FicheActionBadgeStatut from './FicheActionForm/FicheActionBadgeStatut';
import {useEffect, useRef, useState} from 'react';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import {useUpdateFicheResume} from './data/useUpdateFicheResume';

type Props = {
  link: string;
  ficheAction: FicheResume;
  displayAxe?: boolean;
  openInNewTab?: boolean;
  /** Permet d'afficher le menu d'option de la carte */
  isEditable?: boolean;
};

const FicheActionCard = ({
  openInNewTab,
  ficheAction,
  displayAxe = false,
  link,
  isEditable = false,
}: Props) => {
  const {mutate: updateFiche} = useUpdateFicheResume();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  const [isFocus, setIsFocus] = useState(false);

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

  const handleChangeTitle = () => {
    if (inputRef.current) {
      if (ficheAction.titre) {
        inputRef.current.value !== ficheAction.titre &&
          updateFiche({...ficheAction, titre: inputRef.current.value.trim()});
      } else {
        inputRef.current.value.trim().length > 0 &&
          updateFiche({...ficheAction, titre: inputRef.current.value.trim()});
      }
    }
  };

  /** Fonction donné à l'event listener pour change le state focus */
  const handleSetFocus = () => {
    if (document.activeElement === inputRef.current) {
      setIsFocus(true);
    } else {
      setIsFocus(false);
    }
  };

  /** Fonction donné à l'event listener pour gérer la toucher entrée */
  const handleEnterKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      inputRef.current?.blur();
      setIsEdit(false);
    }
  };

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
    document.addEventListener('focusin', handleSetFocus);
    document.addEventListener('focusout', handleSetFocus);
    inputRef.current?.addEventListener('keydown', handleEnterKeydown);
    window.addEventListener('click', handleDetectOutsideClick);

    return () => {
      document.removeEventListener('focusin', handleSetFocus);
      document.removeEventListener('focusout', handleSetFocus);
      inputRef.current?.removeEventListener('keydown', handleEnterKeydown);
      window.removeEventListener('click', handleDetectOutsideClick);
    };
  }, []);

  /** Ajoute un delay pour ajouter le focus à l'input après le clique sur le bouton éditer */
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => {
      clearTimeout(timer);
    };
  }, [isEdit]);

  return (
    <div
      data-test="ActionCarte"
      id={carteId}
      className="relative group h-full border border-gray-200 hover:bg-grey975"
    >
      {/** Menu d'options */}
      {isEditable && (
        <div className="absolute top-4 right-4 hidden group-hover:!flex">
          {isEdit ? (
            <NavLink
              to={link}
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
              className={classNames(
                'fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line'
              )}
            />
          )}
        </div>
      )}
      {/** Carte */}
      <NavLink
        to={link}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={classNames({'after:!hidden': openInNewTab})}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center mb-3">
            {ficheAction.statut && (
              <FicheActionBadgeStatut statut={ficheAction.statut} small />
            )}
            <div className={classNames({'ml-4': ficheAction.statut})}>
              <div
                className="py-0.5 px-2 font-bold text-xs uppercase border border-black whitespace-nowrap rounded-md"
                title="Priorité"
              >
                élevé
              </div>
            </div>
            <div
              className={classNames({'ml-4': ficheAction.statut || true})}
              title="Échéance"
            >
              <div className="text-sm text-gray-500 whitespace-nowrap">
                30/09/2023
              </div>
            </div>
          </div>
          {ficheAction.pilotes && (
            <div className="mb-3 text-sm text-gray-600" title="Pilotes">
              <span className="fr-icon-user-line mr-2 before:!w-4" />
              {ficheAction.pilotes?.map(pilote => pilote.nom).join(' | ')}
            </div>
          )}
          {displayAxe && (
            <div className="mb-3 text-sm text-gray-400" title="Emplacements">
              {ficheAction.plans
                ? ficheAction.plans
                    ?.map(plan => generateTitle(plan?.nom))
                    .join(' | ')
                : 'Fiches non classées'}
            </div>
          )}
          <div className="mb-auto font-medium line-clamp-3" title="Titre">
            <TextareaControlled
              ref={inputRef}
              id={`fiche-titre-${ficheAction.id?.toString()}`}
              className={classNames(
                'grow !p-0 !min-h-0 !text-base text-left !outline-none !resize-none placeholder:text-gray-900 disabled:pointer-events-none disabled:cursor-pointer disabled:text-gray-900',
                {
                  'placeholder:text-gray-400': isFocus,
                }
              )}
              initialValue={ficheAction.titre}
              onBlur={handleChangeTitle}
              placeholder={'Sans titre'}
              disabled={!isEdit}
            />
          </div>
        </div>
      </NavLink>
    </div>
  );
};

export default FicheActionCard;
