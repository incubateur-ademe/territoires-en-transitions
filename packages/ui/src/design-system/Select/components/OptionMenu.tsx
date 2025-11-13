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

import { Button } from '../../Button';
import { Icon } from '../../Icon';

import { DeleteOptionModal, UpdateOptionModal } from '../../Select';
import { Option } from '../utils';
import { CreateOption } from './SelectBase';

type Props = Omit<CreateOption, 'userCreatedOptions' | 'onCreate'> & {
  /** L'option à modifier */
  option: Option;
};

/** Menu affiché dans l'option d'un sélecteur */
export const OptionMenu = ({
  option,
  onDelete,
  onUpdate,
  updateModal,
  deleteModal,
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

  /** Modales d'édition des labels */
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
            {onUpdate && (
              // Edition de l'option
              <>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="flex items-center w-full py-2 pr-4 pl-3 text-xs text-grey-8"
                  type="button"
                >
                  <Icon icon="edit-line" size="xs" className="mr-2" />
                  Éditer
                </button>
                {isEditOpen && (
                  <UpdateOptionModal
                    openState={{
                      isOpen: isEditOpen,
                      setIsOpen: (state) => {
                        setIsEditOpen(state);
                        if (state === false) setIsOpen(false);
                      },
                    }}
                    tagName={option.label}
                    title={updateModal?.title}
                    fieldTitle={updateModal?.fieldTitle}
                    onSave={(newName) => onUpdate(option.value, newName)}
                  />
                )}
              </>
            )}

            {onDelete && (
              // Suppression de l'option
              <>
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="flex items-center w-full py-2 pr-4 pl-3 text-xs text-grey-8"
                  type="button"
                >
                  <Icon icon="delete-bin-6-line" size="xs" className="mr-2" />
                  Supprimer
                </button>
                {isDeleteOpen && (
                  <DeleteOptionModal
                    openState={{
                      isOpen: isDeleteOpen,
                      setIsOpen: (state) => {
                        setIsDeleteOpen(state);
                        if (state === false) setIsOpen(false);
                      },
                    }}
                    tagName={option.label}
                    title={deleteModal?.title}
                    message={deleteModal?.message}
                    onDelete={() => onDelete(option.value)}
                  />
                )}
              </>
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
      type="button"
      ref={ref}
      icon="more-line"
      size="xs"
      variant="grey"
      className="!p-1 !h-6 m-auto !text-grey-7"
    />
  </div>
));
OptionMenuButton.displayName = 'OptionOpenFloaterButton';
