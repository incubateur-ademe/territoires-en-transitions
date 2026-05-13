'use client';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { ButtonProps } from '../Button/types';
import { ModalSize } from '../ModalNext/Modal.next';

const sizeMaxWidth = {
  xs: 'max-w-modal-xs',
  sm: 'max-w-modal-sm',
  md: 'max-w-modal-md',
  lg: 'max-w-modal-lg',
  xl: 'max-w-modal-xl',
} as const satisfies Record<ModalSize, string>;

type AlertModalProps = {
  openState?: { isOpen: boolean; setIsOpen: (open: boolean) => void };
  defaultOpen?: boolean;
  size?: ModalSize;
  children: ReactNode;
};

const AlertModalTrigger = ({ children }: { children: ReactNode }) => {
  return (
    <AlertDialogPrimitive.Trigger asChild>
      {children}
    </AlertDialogPrimitive.Trigger>
  );
};

const AlertModalHeader = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <header
      className={cn(
        'flex flex-col shrink-0 pb-4 border-b border-grey-3',
        className
      )}
    >
      {children}
    </header>
  );
};

const AlertModalTitle = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <AlertDialogPrimitive.Title asChild>
      <h2 className={cn('mb-0 text-2xl font-bold text-primary-9', className)}>
        {children}
      </h2>
    </AlertDialogPrimitive.Title>
  );
};

const AlertModalSubtitle = ({
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

const AlertModalDescription = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <AlertDialogPrimitive.Description asChild>
      <p className={cn('mb-0 text-base text-grey-8', className)}>{children}</p>
    </AlertDialogPrimitive.Description>
  );
};

const AlertModalBody = ({
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

const AlertModalFooter = ({
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

const AlertModalAction = (props: ButtonProps) => {
  return (
    <AlertDialogPrimitive.Action asChild>
      <Button variant="primary" {...props} />
    </AlertDialogPrimitive.Action>
  );
};

const AlertModalCancel = (props: ButtonProps) => {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button variant="outlined" {...props} />
    </AlertDialogPrimitive.Cancel>
  );
};

export const AlertModal = ({
  openState,
  defaultOpen,
  size = 'md',
  children,
}: AlertModalProps) => {
  return (
    <AlertDialogPrimitive.Root
      open={openState?.isOpen}
      onOpenChange={openState?.setIsOpen}
      defaultOpen={defaultOpen}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 bg-overlay z-modal" />
        <AlertDialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-modal flex flex-col gap-6 w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] p-6 bg-white rounded-md border border-grey-4 shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] overflow-hidden',
            sizeMaxWidth[size]
          )}
        >
          {children}
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};

AlertModal.Trigger = AlertModalTrigger;
AlertModal.Header = AlertModalHeader;
AlertModal.Title = AlertModalTitle;
AlertModal.Subtitle = AlertModalSubtitle;
AlertModal.Description = AlertModalDescription;
AlertModal.Body = AlertModalBody;
AlertModal.Footer = AlertModalFooter;
AlertModal.Action = AlertModalAction;
AlertModal.Cancel = AlertModalCancel;
