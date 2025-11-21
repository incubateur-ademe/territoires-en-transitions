import {
  FloatingFocusManager,
  FloatingNode,
  FloatingOverlay,
  FloatingPortal,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useId,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import classNames from 'classnames';
import { RefObject, cloneElement } from 'react';

import { useOpenState } from '@/ui/hooks/use-open-state';
import { preset } from '@/ui/tailwind-preset';
import { OpenState } from '@/ui/utils/types';
import { Button } from '../Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeToClass: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-[40rem]',
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
  /** Référence du container de la modale */
  ref: RefObject<HTMLElement>;
};

/** Types des props du composant générique Modal */
export type ModalProps = {
  /** Fonction de rendu du contenu de la modale */
  render?: (props: RenderProps) => React.ReactNode;
  /** Rendu pied de page optionnel */
  renderFooter?: (props: Pick<RenderProps, 'close'>) => React.ReactNode;
  /** l'élément qui permet d'afficher la modale au click, généralement un bouton */
  children?: JSX.Element;
  /** Titre de la modale, n'est pas affiché si non défini */
  title?: string;
  /** Sous-titre de la modale, n'est pas affiché si non défini */
  subTitle?: string;
  /** Description de la modale, n'est pas affichée si non définie. Elle est placée sous le titre */
  description?: string;
  /** Titre et description centrés par défaut */
  textAlign?: 'left' | 'center' | 'right';
  /** Permet de contrôler l'ouverture de la modale */
  openState?: OpenState;
  /** fonction appelée lors de la fermeture de la modale */
  onClose?: () => void;
  /** max-width prédéfinies, valeur par défaut "md" */
  size?: ModalSize;
  /** désactive la fermeture lors du clic sur le fond */
  disableDismiss?: boolean;
  /** n'affiche pas le bouton Fermer */
  noCloseButton?: boolean;
  /** Ajoute un effet flouté sur l'overlay */
  backdropBlur?: boolean;
  /** z-index de la modale, est placé sur l'overlay */
  zIndex?: string | number;
  /** Id de test */
  dataTest?: string;
  /** When true, ensures the modal's footer is always visible (content is made scrollable when needed)*/
  footerIsAlwaysVisible?: boolean;
};

/*
 * Basic modal
 * If you provide isOpen you must add the corresponding setState function.
 */
export const Modal = ({
  render,
  children,
  title,
  subTitle,
  description,
  textAlign = 'center',
  openState,
  onClose,
  size = 'md',
  disableDismiss,
  noCloseButton,
  renderFooter,
  backdropBlur,
  dataTest = 'Modal',
  footerIsAlwaysVisible = false,
}: ModalProps) => {
  const { isOpen, toggleIsOpen } = useOpenState(openState);

  const handleOpenChange = () => {
    if (isOpen && onClose) {
      onClose();
    }
    toggleIsOpen();
  };

  const nodeId = useFloatingNodeId();

  const { refs, context } = useFloating({
    nodeId,
    open: isOpen,
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

  const footerClassName = footerIsAlwaysVisible ? 'sticky bottom-0' : '';
  const contentClassName = classNames('flex flex-col gap-8 ', {
    'h-full overflow-y-auto relative': footerIsAlwaysVisible,
  });

  return (
    <>
      {children &&
        cloneElement(
          children,
          getReferenceProps({ ref: refs.setReference, ...children.props })
        )}
      <FloatingNode id={nodeId}>
        {isOpen && (
          <FloatingPortal>
            <FloatingOverlay
              lockScroll
              style={{
                display: 'grid',
                placeItems: 'center',
                background: preset.theme.extend.colors.overlay,
                zIndex: preset.theme.extend.zIndex.modal,
                backdropFilter: backdropBlur ? 'blur(10px)' : undefined,
              }}
            >
              <FloatingFocusManager context={context}>
                <div
                  data-test={dataTest}
                  {...getFloatingProps({
                    ref: refs.setFloating,
                    'aria-labelledby': labelId,
                    'aria-describedby': descriptionId,
                    className: classNames(
                      `
                                  relative flex flex-col self-end gap-8 w-full mx-auto px-10 py-12
                                  rounded-xl bg-white border border-grey-4 shadow-[0_4px_20px_0px_rgba(0,0,0,0.05)]
                                  sm:self-center sm:w-[calc(100%-3rem)]
                                  md:p-[4.5rem] md:pb-[2.5rem]
                                `,
                      sizeToClass[size],
                      {
                        'mt-8 sm:my-6': !footerIsAlwaysVisible,
                        'max-h-[calc(100vh-2rem)]': footerIsAlwaysVisible,
                      }
                    ),
                  })}
                >
                  {!noCloseButton && (
                    <Button
                      data-html2canvas-ignore
                      data-test={`close-${dataTest}`}
                      title="Fermer"
                      onClick={handleOpenChange}
                      icon="close-line"
                      variant="grey"
                      size="xs"
                      className="!absolute max-md:top-4 top-8 max-md:right-4 right-8"
                    />
                  )}
                  {(title || subTitle || description) && (
                    <div
                      className={classNames('flex flex-col gap-4', {
                        'text-left': textAlign === 'left',
                        'text-center': textAlign === 'center',
                        'text-right': textAlign === 'right',
                      })}
                    >
                      {title && (
                        <h3 id={labelId} className="mb-0 text-primary-10">
                          {title}
                        </h3>
                      )}
                      {subTitle && (
                        <p className="mb-0 font-bold text-primary">
                          {subTitle}
                        </p>
                      )}
                      {description && (
                        <p id={descriptionId} className="mb-0">
                          {description}
                        </p>
                      )}
                    </div>
                  )}
                  {render && (
                    <div className={contentClassName}>
                      {render?.({
                        close: handleOpenChange,
                        labelId,
                        descriptionId,
                        ref: refs.floating,
                      })}
                    </div>
                  )}
                  <div className={footerClassName}>
                    {renderFooter?.({
                      close: handleOpenChange,
                    })}
                  </div>
                </div>
              </FloatingFocusManager>
            </FloatingOverlay>
          </FloatingPortal>
        )}
      </FloatingNode>
    </>
  );
};
