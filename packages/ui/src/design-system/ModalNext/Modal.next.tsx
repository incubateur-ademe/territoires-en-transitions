'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  createContext,
  forwardRef,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { uiLabels } from '../../labels/catalog';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { ButtonProps } from '../Button/types';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMaxWidth = {
  xs: 'max-w-modal-xs',
  sm: 'max-w-modal-sm',
  md: 'max-w-modal-md',
  lg: 'max-w-modal-lg',
  xl: 'max-w-modal-xl',
} as const satisfies Record<ModalSize, string>;

type ModalProps = {
  openState?: { isOpen: boolean; setIsOpen: (open: boolean) => void };
  defaultOpen?: boolean;
  size?: ModalSize;
  dismissable?: boolean;
  children: ReactNode;
};

type ModalContextValue = {
  dismissable: boolean;
  setLocked: (locked: boolean) => void;
};

const ModalContext = createContext<ModalContextValue>({
  dismissable: true,
  setLocked: () => {},
});

const ModalTrigger = ({ children }: { children: ReactNode }) => {
  return <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>;
};

const ModalHeader = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { dismissable } = useContext(ModalContext);
  return (
    <header
      className={cn(
        'flex shrink-0 items-start gap-3 pb-4 border-b border-grey-3',
        className
      )}
    >
      <div className="flex flex-1 flex-col min-w-0">{children}</div>
      {dismissable && (
        <DialogPrimitive.Close asChild>
          <Button
            icon="close-line"
            variant="grey"
            size="xs"
            title={uiLabels.fermer}
          />
        </DialogPrimitive.Close>
      )}
    </header>
  );
};

const ModalTitle = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <DialogPrimitive.Title asChild>
      <h2 className={cn('mb-0 text-2xl font-bold text-primary-9', className)}>
        {children}
      </h2>
    </DialogPrimitive.Title>
  );
};

const ModalSubtitle = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn('mt-0 mb-0 text-base font-medium text-grey-8', className)}
    >
      {children}
    </p>
  );
};

const ModalDescription = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <DialogPrimitive.Description asChild>
      <p className={cn('mb-0 text-base text-grey-8', className)}>{children}</p>
    </DialogPrimitive.Description>
  );
};

const ModalBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-2 min-h-0 overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

const ModalFooter = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <footer
      className={cn(
        'flex shrink-0 items-center justify-end gap-4 pt-4 border-t border-grey-4',
        className
      )}
    >
      {children}
    </footer>
  );
};

type ModalOkProps = ButtonProps & {
  /**
   * Quand `true`, désactive le bouton, affiche un loader, marque `aria-busy`
   * et empêche la fermeture de la modale (ESC, clic extérieur, bouton X) tant
   * que l'action est en cours.
   */
  pending?: boolean;
};

const ModalOk = ({ pending, disabled, ...props }: ModalOkProps) => {
  const { setLocked } = useContext(ModalContext);

  useEffect(() => {
    setLocked(!!pending);
    return () => setLocked(false);
  }, [pending, setLocked]);

  return (
    <Button
      variant="primary"
      disabled={pending || disabled}
      loading={pending}
      aria-busy={pending}
      {...props}
    />
  );
};

const ModalCancel = (props: ButtonProps) => {
  return (
    <DialogPrimitive.Close asChild>
      <Button variant="outlined" {...props} />
    </DialogPrimitive.Close>
  );
};

const ModalContent = forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, ref) => {
    return (
      <div
        ref={ref}
        className="flex flex-col gap-6 max-h-[calc(100dvh-2rem)] p-6 bg-white rounded-md border border-grey-4 shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] overflow-hidden"
      >
        {children}
      </div>
    );
  }
);
ModalContent.displayName = 'ModalContent';

export const Modal = ({
  openState,
  defaultOpen,
  size = 'md',
  dismissable = true,
  children,
}: ModalProps) => {
  const [locked, setLocked] = useState(false);
  const effectiveDismissable = dismissable && !locked;

  const handleEscapeKeyDown = effectiveDismissable
    ? undefined
    : (event: KeyboardEvent) => event.preventDefault();
  const handlePointerDownOutside = effectiveDismissable
    ? undefined
    : (event: Event) => event.preventDefault();

  return (
    <DialogPrimitive.Root
      open={openState?.isOpen}
      onOpenChange={openState?.setIsOpen}
      defaultOpen={defaultOpen}
    >
      <ModalContext.Provider
        value={{ dismissable: effectiveDismissable, setLocked }}
      >
        <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-overlay z-modal" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-modal w-[calc(100vw-2rem)]',
            sizeMaxWidth[size]
          )}
          onEscapeKeyDown={handleEscapeKeyDown}
          onPointerDownOutside={handlePointerDownOutside}
        >
          <ModalContent>{children}</ModalContent>
        </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </ModalContext.Provider>
    </DialogPrimitive.Root>
  );
};

Modal.Trigger = ModalTrigger;
Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Subtitle = ModalSubtitle;
Modal.Description = ModalDescription;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Ok = ModalOk;
Modal.Cancel = ModalCancel;
