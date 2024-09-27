import { ComponentProps, ForwardedRef, Ref, forwardRef } from 'react';
import classNames from 'classnames';
import { Button, ButtonProps } from '@tet/ui';

// ComponentProps<typeof Button>['ref']
const DeleteButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps & { variant?: 'white' | 'grey' }
>(({ variant = 'grey', className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      {...props}
      icon="delete-bin-6-line"
      variant={variant}
      className={classNames(
        {
          '!text-error-1 hover:!text-[#db4f4f]': !props.disabled,
        },
        className
      )}
    />
  );
});

export default DeleteButton;
