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
      size,
      // Réservé à la case à cocher : l'interrupteur garde sa couleur.
      checkedColor,
      ...props
    }: CheckboxProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    return (
      // La `className` passée par le consommateur est portée par ce wrapper,
      // et non par l'`<input>` : la coche ci-dessous est un élément frère
      // positionné en absolu, qu'une classe comme `opacity-0` doit couvrir
      // elle aussi pour masquer tout l'interrupteur.
      <div className={cn('relative flex', className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={checked ?? false}
          readOnly={readOnly ?? !onChange}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            '!appearance-none shrink-0 checked:bg-primary checked:disabled:bg-primary-5',
            'relative bg-grey-4 rounded-full w-10 h-6'
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
InputSwitch.displayName = 'InputSwitch';
