import {forwardRef, Ref} from 'react';
import classNames from 'classnames';

const SmallIconButton = forwardRef(
  (
    {className, ...props}: React.ComponentPropsWithRef<'button'>,
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      className={classNames(
        'ml-1 px-1 w-7 text-sm inline-block text-center',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

export const ButtonClose = forwardRef(
  (
    {className, ...props}: React.ComponentPropsWithRef<'button'>,
    ref?: Ref<HTMLButtonElement>
  ) => (
    <SmallIconButton
      className={classNames('fr-fi-close-line', className)}
      {...props}
    />
  )
);

export const ButtonRemove = forwardRef(
  (
    {className, ...props}: React.ComponentPropsWithRef<'button'>,
    ref?: Ref<HTMLButtonElement>
  ) => (
    <SmallIconButton
      className={classNames('fr-fi-delete-line', className)}
      {...props}
    />
  )
);

export const ButtonComment = forwardRef(
  (
    {className, ...props}: React.ComponentPropsWithRef<'button'>,
    ref?: Ref<HTMLButtonElement>
  ) => (
    <SmallIconButton
      className={classNames('fr-icon-quote-line', className)}
      {...props}
    />
  )
);

export const ButtonEdit = forwardRef(
  (
    {className, ...props}: React.ComponentPropsWithRef<'button'>,
    ref?: Ref<HTMLButtonElement>
  ) => (
    <SmallIconButton
      className={classNames('fr-fi-edit-line', className)}
      {...props}
    />
  )
);
