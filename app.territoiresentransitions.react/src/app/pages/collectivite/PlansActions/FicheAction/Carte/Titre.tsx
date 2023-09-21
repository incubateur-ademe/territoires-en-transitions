import {useEffect, useRef, useState} from 'react';

import TextareaControlled from 'ui/shared/form/TextareaControlled';
import {useUpdateFicheResume} from '../data/useUpdateFicheResume';
import {FicheResume} from '../data/types';
import classNames from 'classnames';

type Props = {
  isEdit: boolean;
  setIsEdit: (isEdit: boolean) => void;
  fiche: FicheResume;
};

const Titre = ({fiche, isEdit, setIsEdit}: Props) => {
  const {mutate: updateFiche} = useUpdateFicheResume();

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [isFocus, setIsFocus] = useState(false);
  const handleChangeTitle = () => {
    if (inputRef.current) {
      if (fiche.titre) {
        inputRef.current.value !== fiche.titre &&
          updateFiche({...fiche, titre: inputRef.current.value.trim()});
      } else {
        inputRef.current.value.trim().length > 0 &&
          updateFiche({...fiche, titre: inputRef.current.value.trim()});
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
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault();
      inputRef.current?.blur();
      setIsEdit(false);
    }
  };

  /** Ajoute et supprime les events listener */
  useEffect(() => {
    document.addEventListener('focusin', handleSetFocus);
    document.addEventListener('focusout', handleSetFocus);
    inputRef.current?.addEventListener('keydown', handleEnterKeydown);

    return () => {
      document.removeEventListener('focusin', handleSetFocus);
      document.removeEventListener('focusout', handleSetFocus);
      inputRef.current?.removeEventListener('keydown', handleEnterKeydown);
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
    <div className="mb-auto font-medium line-clamp-3" title="Titre">
      <TextareaControlled
        ref={inputRef}
        id={`fiche-titre-${fiche.id?.toString()}`}
        className={classNames(
          'grow !p-0 !min-h-0 !text-base text-left !outline-none !resize-none placeholder:text-gray-900 disabled:pointer-events-none disabled:cursor-pointer disabled:text-gray-900',
          {
            'placeholder:!text-gray-400': isFocus,
          }
        )}
        initialValue={fiche.titre}
        onBlur={handleChangeTitle}
        placeholder={'Sans titre'}
        disabled={!isEdit}
      />
    </div>
  );
};

export default Titre;
