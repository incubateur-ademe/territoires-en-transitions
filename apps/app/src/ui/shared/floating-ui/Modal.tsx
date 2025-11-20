import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useId,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { Button } from '@tet/ui';
import classNames from 'classnames';
import React, { cloneElement, Dispatch, SetStateAction, useState } from 'react';

export type RenderProps = {
  close: () => void;
  labelId: string;
  descriptionId: string;
};

export type ModalProps = {
  /** où il faut mettre le contenu de la modale */
  render: (props: RenderProps) => React.ReactNode;
  /** l'élément qui permet d'afficher la modale au click */
  children?: JSX.Element;
  /** s'il n'y a pas d'élément permettant d'afficher la modale,
     on peut lui passer un booléen mais celui ci doit être accompagné d'un setter (setExternalOpen)
     afin de pouvoir la fermer */
  externalOpen?: boolean;
  /* accompagne "externalOpen" afin de pouvoir fermer la modale */
  setExternalOpen?:
    | Dispatch<SetStateAction<boolean>>
    | ((opened: boolean) => void);
  /** fonction appelée lors de la fermeture de la modale */
  onClose?: () => void;
  /** max-width prédéfinies dans le DSFR, valeur par défaut "md" */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** désactive la fermeture lors du clic sur le fond */
  disableDismiss?: boolean;
  /** n'affiche pas le bouton Fermer */
  noCloseButton?: boolean;
  zIndex?: string | number;
};

/*
 * Basic modal
 * floating-ui doc: https://floating-ui.com/docs/react-dom-interactions
 * If you provide externalOpen you must add the corresponding setState function.
 */
const Modal = ({
  render,
  children,
  externalOpen,
  setExternalOpen,
  onClose,
  size = 'md',
  disableDismiss,
  noCloseButton,
  zIndex,
}: ModalProps) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = () => {
    setExternalOpen ? setExternalOpen(!externalOpen) : setOpen(!open);
    if (externalOpen || open) {
      onClose && onClose();
    }
  };

  const { refs, context } = useFloating({
    open: externalOpen ?? open,
    onOpenChange: handleOpenChange,
  });

  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useRole(context),
    useDismiss(context, { enabled: !disableDismiss }),
  ]);

  return (
    <>
      {children &&
        cloneElement(
          children,
          getReferenceProps({ ref: refs.setReference, ...children.props })
        )}
      <FloatingPortal>
        {(open || externalOpen) && (
          <FloatingOverlay
            lockScroll
            style={{
              display: 'grid',
              placeItems: 'center',
              background: 'hsla(0deg, 0%, 8.6%, 0.375)',
              zIndex: zIndex ?? 1100,
            }}
          >
            <FloatingFocusManager context={context}>
              <div
                data-test="Modal"
                {...getFloatingProps({
                  ref: refs.setFloating,
                  className: classNames(
                    `
                    mt-8 w-full mx-auto self-end
                    sm:self-center sm:w-[calc(100%-3rem)] sm:my-6`,
                    {
                      'max-w-sm': size === 'sm',
                      'max-w-xl': size === 'md',
                      'max-w-4xl': size === 'lg',
                      'max-w-[1200px]': size === 'xl',
                    }
                  ),
                  'aria-labelledby': labelId,
                  'aria-describedby': descriptionId,
                })}
              >
                <div className="flex flex-col p-4 bg-white md:px-8">
                  {noCloseButton ? null : (
                    <Button
                      dataTest="close-modal"
                      className="ml-auto mb-2 md:-mr-4"
                      icon="close-line"
                      iconPosition="right"
                      size="xs"
                      variant="grey"
                      onClick={handleOpenChange}
                    />
                  )}
                  {render({
                    close: () => setOpen(false),
                    labelId,
                    descriptionId,
                  })}
                </div>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </>
  );
};

export default Modal;
