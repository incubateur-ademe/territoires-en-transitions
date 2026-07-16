import { Button, ButtonProps } from '@tet/ui';
import classNames from 'classnames';
import { forwardRef } from 'react';
import { RiDeleteBin6Line } from '@remixicon/react';

// ComponentProps<typeof Button>['ref']
const DeleteButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps & { variant?: 'white' | 'grey' }
>(({ variant = 'grey', className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      {...props}
      icon={<RiDeleteBin6Line />}
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

DeleteButton.displayName = 'DeleteButton';

export default DeleteButton;
