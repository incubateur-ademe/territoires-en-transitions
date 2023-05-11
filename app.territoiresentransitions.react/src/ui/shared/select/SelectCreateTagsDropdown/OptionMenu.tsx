import {useEffect, useRef, useState} from 'react';
import InputControlled from 'ui/shared/form/InputControlled';
import {TOption} from '../commons';
import Modal from 'ui/shared/floating-ui/Modal';
import {BoutonAttention} from 'ui/buttons/BoutonAttention';

type Props = {
  option: TOption;
  onDeleteClick?: (id: string) => void;
  onUpdateTagName?: (tag_id: string, tag_name: string) => void;
  close?: () => void;
};

const OptionMenu = ({option, onDeleteClick, onUpdateTagName, close}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const handleChangeTitle = () => {
    if (inputRef.current && onUpdateTagName) {
      if (inputRef.current.value.trim().length === 0) {
        return setShowErrorMessage(true);
      }
      if (inputRef.current.value !== option.label) {
        onUpdateTagName(option.value, inputRef.current.value.trim());
        close && close();
      }
    }
  };

  const handleEnterKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    inputRef.current?.addEventListener('keydown', handleEnterKeydown);
    return () => {
      inputRef.current?.removeEventListener('keydown', handleEnterKeydown);
    };
  }, []);

  return (
    <div className="p-6 w-[18rem]">
      <InputControlled
        ref={inputRef}
        id="tag-name"
        initialValue={option.label ?? ''}
        onBlur={handleChangeTitle}
        placeholder="Titre du tag"
        className="fr-input resize-none !outline-none"
      />
      {showErrorMessage && (
        <p className="fr-error-text !mt-2">Vous devez entrer une valeur</p>
      )}
      <Modal
        size="sm"
        zIndex={1500}
        noCloseButton
        render={({descriptionId, close}) => {
          return (
            <>
              <p id={descriptionId} className="mt-2">
                Souhaitez-vous vraiment supprimer cette option pour toutes les
                fiches action de votre collectivité ?
              </p>
              <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
                <button
                  className="fr-btn fr-btn--secondary"
                  onClick={() => {
                    close && close();
                  }}
                >
                  Annuler
                </button>
                <BoutonAttention
                  onClick={() => {
                    onDeleteClick && onDeleteClick(option.value);
                    close && close();
                  }}
                >
                  Supprimer
                </BoutonAttention>
              </div>
            </>
          );
        }}
      >
        <button className="fr-btn fr-btn--secondary fr-btn--icon-left fr-fi-delete-line mt-4">
          Supprimer
        </button>
      </Modal>
    </div>
  );
};

export default OptionMenu;
