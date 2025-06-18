import {
  FloatingFocusManager,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { Ref, cloneElement, forwardRef, useState } from 'react';

import { Button } from '@/ui/design-system/Button';
import { Icon } from '@/ui/design-system/Icon';
import { Modal } from '@/ui/design-system/Modal';

import { CustomAction, Option, OptionValue } from '../utils';

type Props = {
  /** L'option à modifier */
  option: Option;
  /** Fonction pour supprimer l'option */
  onDelete?: (id: OptionValue) => void;
  /** Fonction pour éditer l'option */
  onUpdate?: (id: OptionValue, inputValue: string) => void;
  /** Fonctions customs ajoutées au menu */
  customActions?: CustomAction[];
};

/** Menu affiché dans l'option d'un sélecteur */
export const OptionMenu = ({
  option,
  onDelete,
  onUpdate,
  customActions,
}: Props) => {
  /** Gère l'état d'ouverture du menu */
  const [isOpen, setIsOpen] = useState(false);

  /** Initialise floating-ui */
  const { x, y, refs, strategy, context } = useFloating({
    placement: 'top-end',
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  /** Initialise les intéractions */
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useFocus(context),
    useRole(context, { role: 'menu' }),
    useDismiss(context),
  ]);

  /** Valeur de l'input de modification du label */
  const [inputValue, setInputValue] = useState(option.label);

  return (
    <>
      {/** Bouton d'ouverture du menu */}
      {cloneElement(
        <OptionMenuButton />,
        getReferenceProps({ ref: refs.setReference })
      )}
      {/** Menu */}
      {isOpen && (
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              position: strategy,
              top: y,
              left: x,
            }}
            className="flex flex-col divide-y divide-x-0 divide-solid divide-grey-3 rounded bg-white border border-grey-3 w-fit"
            onClick={(evt) => {
              evt.stopPropagation();
            }}
          >
            {customActions &&
              customActions.length &&
              customActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => action.action(option.value)}
                  className="flex items-center w-full py-2 pr-4 pl-3 text-xs text-grey-8 shrink-0"
                >
                  <Icon icon={action.icon} size="xs" className="mr-2" />
                  {action.label}
                </button>
              ))}
            {onUpdate && (
              <Modal
                title="Éditer l'option"
                onClose={() => setIsOpen(false)}
                render={({ close }) => {
                  const handleClose = () => {
                    close();
                    setIsOpen(false);
                  };
                  return (
                    <div className="flex flex-col">
                      <input
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full py-3 px-4 rounded-xl border border-solid border-grey-4 bg-grey-1 outline-none"
                      />
                      <div className="flex gap-4 mt-8 ml-auto">
                        <Button variant="grey" onClick={handleClose}>
                          Annuler
                        </Button>
                        <Button
                          onClick={() => {
                            onUpdate(option.value, inputValue);
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
                <button className="flex items-center w-full py-2 pr-4 pl-3 text-xs text-grey-8">
                  <Icon icon="edit-line" size="xs" className="mr-2" />
                  Éditer
                </button>
              </Modal>
            )}
            {onDelete && (
              /** Modale pour supprimer l'option */
              <Modal
                title="Supprimer"
                description="Souhaitez-vous vraiment supprimer cette option de votre collectivité ?"
                textAlign="left"
                onClose={() => setIsOpen(false)}
                render={({ close }) => {
                  return (
                    <div className="flex gap-4 ml-auto">
                      <Button variant="grey" onClick={close}>
                        Annuler
                      </Button>
                      <Button
                        onClick={() => {
                          onDelete(option.value);
                          close();
                        }}
                      >
                        Valider
                      </Button>
                    </div>
                  );
                }}
              >
                <button className="flex items-center w-full py-2 pr-4 pl-3 text-xs text-grey-8">
                  <Icon icon="delete-bin-6-line" size="xs" className="mr-2" />
                  Supprimer
                </button>
              </Modal>
            )}
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
};

/** Bouton pour ouvrir le menu d'une option */
const OptionMenuButton = forwardRef((props, ref?: Ref<HTMLButtonElement>) => (
  // div ajoutée pour match la couleur du background de l'option lors hover sur l'option
  <div className="flex px-3 py-1.5 grow group-hover:bg-primary-0 hover:!bg-white">
    <Button
      {...props}
      ref={ref}
      icon="more-line"
      size="xs"
      variant="grey"
      className="!p-1 !h-6 m-auto !text-grey-7"
    />
  </div>
));
OptionMenuButton.displayName = 'OptionOpenFloaterButton';
