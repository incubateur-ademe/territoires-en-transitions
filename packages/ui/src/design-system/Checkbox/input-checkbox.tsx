import { forwardRef, Ref } from 'react';

import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { CheckboxProps } from './Checkbox';

export const InputCheckbox = forwardRef(
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
          disabled={disabled}
          readOnly={readOnly ?? !onChange}
          onChange={onChange}
          className={cn(
            '!appearance-none shrink-0',
            'w-5 h-5 border border-solid border-grey-6 rounded',
            { 'border-transparent': checked },
            { 'bg-primary hover:bg-primary-8': checked && !disabled },
            { 'bg-primary-5': checked && disabled },
            { 'border-grey-4': !checked && disabled },
            className
          )}
          {...props}
        />
        {checked && (
          <Icon
            icon="check-line"
            size="sm"
            className={cn(
              'absolute top-px left-0.5 text-white pointer-events-none'
            )}
          />
        )}
      </div>
    );
  }
);
InputCheckbox.displayName = 'InputCheckbox';