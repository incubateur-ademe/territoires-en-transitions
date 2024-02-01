import {Ref, forwardRef, useState} from 'react';

import {DropdownFloater} from '@components/floating-ui/DropdownFloater';
import {Modal} from '@design-system/Modal';
import {Icon} from '@design-system/Icon';
import {Button} from '@design-system/Button';

import {CreateOption} from './SelectBase';
import {Option} from '../utils';

type Props = {
  option: Option;
  createProps: CreateOption;
};

export const OptionMenu = ({option, createProps}: Props) => {
  const [inputValue, setInputValue] = useState(option.label);

  return (
    <DropdownFloater
      offsetValue={{mainAxis: 6}}
      placement="top-end"
      noDropdownStyles
      render={({close: closeMenu}) => (
        <div
          className="flex flex-col divide-y divide-x-0 divide-solid divide-grey-3 rounded overflow-hidden bg-white border border-grey-3"
          onClick={evt => {
            evt.stopPropagation();
          }}
        >
          <Modal
            title="Éditer l'option"
            onClose={closeMenu}
            render={({close}) => {
              const handleClose = () => {
                close();
                closeMenu();
              };
              return (
                <div className="flex flex-col">
                  <input
                    autoFocus
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border border-solid border-grey-4 bg-grey-1 outline-none"
                  />
                  <div className="flex gap-4 mt-8 ml-auto">
                    <Button variant="grey" onClick={handleClose}>
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        createProps.onUpdate(option.value, inputValue);
                        handleClose();
                      }}
                    >
                      Valider
                    </Button>
                  </div>
                </div>
              );
            }}
          >
            <button className="flex items-center w-full py-2 pr-4 pl-3 text-sm text-grey-8">
              <Icon icon="edit-line" size="sm" className="mr-2" />
              Éditer
            </button>
          </Modal>
          <Modal
            title="Supprimer"
            description="Souhaitez-vous vraiment supprimer cette option de votre collectivité ?"
            textAlign="left"
            onClose={closeMenu}
            render={({close}) => {
              return (
                <div className="flex gap-4 ml-auto">
                  <Button variant="grey" onClick={close}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      createProps.onDelete(option.value);
                      close();
                    }}
                  >
                    Valider
                  </Button>
                </div>
              );
            }}
          >
            <button className="flex items-center w-full py-2 pr-4 pl-3 text-sm text-grey-8">
              <Icon icon="delete-bin-6-line" size="sm" className="mr-2" />
              Supprimer
            </button>
          </Modal>
        </div>
      )}
    >
      <OptionMenuButton />
    </DropdownFloater>
  );
};

/** Bouton pour ouvrir le menu d'une option */
const OptionMenuButton = forwardRef((props, ref?: Ref<HTMLButtonElement>) => (
  <div className="flex px-3 py-1.5 grow group-hover:bg-primary-0 hover:!bg-white">
    <Button
      {...props}
      ref={ref}
      icon="more-line"
      size="xs"
      variant="white"
      className="!p-1 m-auto"
    />
  </div>
));
OptionMenuButton.displayName = 'OptionOpenFloaterButton';
