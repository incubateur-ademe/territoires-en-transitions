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
import { uiLabels } from '@tet/ui/labels/catalog';
import { JSX, RefObject, cloneElement } from 'react';

import { useOpenState } from '../../hooks/use-open-state';
import { preset } from '../../tailwind-preset';
import { cn } from '../../utils/cn';
import { OpenState } from '../../utils/types';
import { Button } from '../Button';
import { Divider } from '../Divider';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeToClass: Record<ModalSize, string> = {
  xs: 'max-w-modal-xs',
  sm: 'max-w-modal-sm',
  md: 'max-w-modal-md',
  lg: 'max-w-modal-lg',
  xl: 'max-w-modal-xl',
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
  /** Référence du container de la modale */
  ref: RefObject<HTMLElement | null>;
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
  /** Permet de contrôler l'ouverture de la modale */
  openState?: OpenState;
  /** fonction appelée lors de la fermeture de la modale */
  onClose?: () => void;
  /** max-width prédéfinies, valeur par défaut "sm" */
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
  /** Fige le header et le footer, le body devient scrollable si le contenu dépasse la hauteur de l'écran */
  scrollableContent?: boolean;
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
  openState,
  onClose,
  size = 'sm',
  disableDismiss,
  noCloseButton,
  renderFooter,
  backdropBlur,
  dataTest = 'Modal',
  scrollableContent,
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

  const hasHeader = Boolean(title || subTitle);
  const hasBody = Boolean(render);
  const hasFooter = Boolean(renderFooter);

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
                    ...(title ? { 'aria-labelledby': labelId } : {}),
                    ...(hasBody ? { 'aria-describedby': descriptionId } : {}),
                    className: cn(
                      `
                                  relative flex flex-col self-end gap-3 w-full mx-auto p-6 mt-8
                                  rounded-md bg-white border border-grey-4 shadow-[0_4px_30px_0px_rgba(0,0,0,0.02)]
                                  sm:self-center sm:w-[calc(100%-3rem)] sm:my-6
                                `,
                      sizeToClass[size],
                      {
                        'overflow-hidden max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]':
                          scrollableContent,
                      }
                    ),
                  })}
                >
                  {!noCloseButton && (
                    <div className="absolute top-6 right-6">
                      <Button
                        data-html2canvas-ignore
                        data-test={`close-${dataTest}`}
                        title={uiLabels.fermer}
                        onClick={handleOpenChange}
                        icon="close-line"
                        variant="grey"
                        size="xs"
                      />
                    </div>
                  )}
                  {hasHeader && (
                    <div
                      className={cn('flex flex-col shrink-0', {
                        'pr-9': !noCloseButton,
                      })}
                    >
                      {title && (
                        <h3
                          id={labelId}
                          className="mb-0 text-2xl leading-9 text-primary-9"
                        >
                          {title}
                        </h3>
                      )}
                      {subTitle && (
                        <p className="mb-0 text-base font-medium text-grey-8">
                          {subTitle}
                        </p>
                      )}
                    </div>
                  )}
                  {hasHeader && (hasBody || hasFooter) && <Divider />}
                  {hasBody && (
                    <div
                      id={descriptionId}
                      className={cn('flex flex-col gap-6', {
                        'flex-1 min-h-0 overflow-y-auto': scrollableContent,
                      })}
                    >
                      {render?.({
                        close: handleOpenChange,
                        labelId,
                        ref: refs.floating,
                      })}
                    </div>
                  )}
                  {hasBody && hasFooter && <Divider />}
                  {hasFooter &&
                    renderFooter?.({
                      close: handleOpenChange,
                    })}
                </div>
              </FloatingFocusManager>
            </FloatingOverlay>
          </FloatingPortal>
        )}
      </FloatingNode>
    </>
  );
};
