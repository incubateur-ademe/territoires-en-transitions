import { forwardRef, Ref } from 'react';

import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { CheckboxProps } from './Checkbox';

export const InputSwitch = forwardRef(
  (
    {
      checked,
      disabled,
      readOnly,
      onChange,
      variant,
      className,
      ...props
    }: CheckboxProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    return (
      <div className="relative flex">
        <input
          type="checkbox"
          ref={ref}
          checked={checked ?? false}
          readOnly={readOnly ?? !onChange}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            '!appearance-none shrink-0 checked:bg-primary checked:disabled:bg-primary-5',
            'relative bg-grey-4 rounded-full w-10 h-6',
            className
          )}
          {...props}
        />
        <Icon
          icon="check-line"
          size="sm"
          className={cn(
            'absolute top-1 left-1 text-transparent bg-white rounded-full duration-200 pointer-events-none',
            {
              'text-primary translate-x-4': checked,
              'text-primary-5': checked && disabled,
            }
          )}
        />
      </div>
    );
  }
);
