import {Ref, forwardRef} from 'react';
import classNames from 'classnames';
import {Button, ButtonProps} from '@tet/ui';

const DeleteButton = forwardRef(
  (
    {
      variant = 'grey',
      className,
      ...props
    }: Omit<ButtonProps, 'variant'> & {variant?: 'white' | 'grey' | 'outlined'},
    ref?: Ref<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    return (
      <Button
        ref={ref}
        {...props}
        icon="delete-bin-6-line"
        variant={variant}
        className={classNames(
          {
            '!text-error-1 hover:!text-[#db4f4f]': !props.disabled,
            '!border-error-1 hover:!border-[#db4f4f] hover:!bg-[#fefafa]':
              variant === 'outlined' && !props.disabled,
          },
          className
        )}
      />
    );
  }
);

export default DeleteButton;
