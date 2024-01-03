import {cloneElement, useState} from 'react';
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
import classNames from 'classnames';
import {preset} from '../../tailwind-preset';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeToClass: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-xl',
  lg: 'max-w-4xl',
  xl: 'max-w-[1200px]',
};

/**
 * Props données à la fonction qui rend le contenu de la modale,
 * accessibles dans les composants utilisant la modale
 */
export type RenderProps = {
  /** permet de fermer la modale */
  close: () => void;
  /** l'id à donner au titre pour l'accessibilité */
  labelId: string;
  /** l'id à la description pour l'accessibilité */
  descriptionId: string;
};

/** Types des props du composant générique Modal */
export type ModalProps = {
  /** où il faut mettre le contenu de la modale */
  render?: (props: RenderProps) => React.ReactNode;
  /** l'élément qui permet d'afficher la modale au click, généralement un bouton */
  children?: JSX.Element;
  /** Titre de la modale, n'est pas affiché si non défini */
  title?: string;
  /** Description de la modale, n'est pas affichée si non définie. Elle est placée sous le titre */
  description?: string;
  /** Titre et description centrés par défaut, mettre à false pour aligner à gauche */
  textCenter?: boolean;
  /** s'il n'y a pas d'élément permettant d'afficher la modale,
     on peut lui passer un booléen mais celui ci doit être accompagné d'un setter (setIsOpen)
     afin de pouvoir la fermer */
  isOpen?: boolean;
  /* accompagne "isOpen" afin de pouvoir fermer la modale */
  setIsOpen?: (opened: boolean) => void;
  /** fonction appelée lors de la fermeture de la modale */
  onClose?: () => void;
  /** max-width prédéfinies dans le DSFR, valeur par défaut "md" */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** désactive la fermeture lors du clic sur le fond */
  disableDismiss?: boolean;
  /** n'affiche pas le bouton Fermer */
  noCloseButton?: boolean;
  /** z-index de la modale, est placé sur l'overlay */
  zIndex?: string | number;
};

/*
 * Basic modal
 * If you provide isOpen you must add the corresponding setState function.
 */
const Modal = ({
  render,
  children,
  title,
  description,
  textCenter = true,
  isOpen,
  setIsOpen,
  onClose,
  size = 'md',
  disableDismiss,
  noCloseButton,
  zIndex,
}: ModalProps) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = () => {
    setIsOpen ? setIsOpen(!isOpen) : setOpen(!open);
    if (isOpen || open) {
      onClose && onClose();
    }
  };

  const {refs, context} = useFloating({
    open: isOpen ?? open,
    onOpenChange: handleOpenChange,
  });

  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const {getReferenceProps, getFloatingProps} = useInteractions([
    useClick(context),
    useRole(context),
    useDismiss(context, {enabled: !disableDismiss}),
  ]);

  return (
    <>
      {children &&
        cloneElement(
          children,
          getReferenceProps({ref: refs.setReference, ...children.props})
        )}
      <FloatingPortal>
        {(open || isOpen) && (
          <FloatingOverlay
            lockScroll
            style={{
              display: 'grid',
              placeItems: 'center',
              background: preset.theme.extend.colors.overlay,
              zIndex: zIndex ?? 1100,
            }}
          >
            <FloatingFocusManager context={context}>
              <div
                data-test="Modal"
                {...getFloatingProps({
                  ref: refs.setFloating,
                  'aria-labelledby': labelId,
                  'aria-describedby': descriptionId,
                  className: classNames(
                    `
                      relative flex flex-col self-end gap-8 w-full mt-8 mx-auto p-8
                      rounded-xl bg-white border border-grey-4 shadow-[0_4px_20px_0px_rgba(0,0,0,0.05)]
                      sm:self-center sm:w-[calc(100%-3rem)] sm:my-6
                      md:p-[4.5rem]
                    `,
                    sizeToClass[size]
                  ),
                })}
              >
                {!noCloseButton && (
                  <button
                    onClick={handleOpenChange}
                    className="absolute top-8 right-8 p-2 rounded-lg border border-solid border-grey-3"
                    title="Fermer"
                    data-test="close-modal"
                  >
                    <span className="flex fr-icon-close-line before:w-4 before:h-4 text-primary-7" />
                  </button>
                )}
                {(title || description) && (
                  <div
                    className={classNames('flex flex-col gap-4', {
                      'text-center': textCenter,
                    })}
                  >
                    {title && (
                      <h3 id={labelId} className="mb-0">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p id={descriptionId} className="mb-0">
                        {description}
                      </p>
                    )}
                  </div>
                )}
                {render &&
                  render({
                    close: () => setOpen(false),
                    labelId,
                    descriptionId,
                  })}
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </>
  );
};

export default Modal;
