import { Ref, forwardRef, useId } from 'react';

import { cn } from '../../utils/cn';
import { FieldMessage, FieldMessageProps } from '../Field';
import { InputCheckbox } from './input-checkbox';
import { InputSwitch } from './input-switch';

export type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'type' | 'size'
> & {
  /** Libellé associé à la case à cocher */
  label?: React.ReactNode;
  /** Variante visuelle */
  variant?: 'checkbox' | 'switch';
  /** Pour styliser le container */
  containerClassname?: string;
  /** Pour styliser le label */
  labelClassname?: string;
  /** Taille du label */
  size?: 'sm' | 'md';
} & FieldMessageProps;

/**
 * Affiche une case à cocher (ou un interrupteur) et optionnellement un
 * libellé, et un message complémentaire éventuellement stylé en fonction d'un
 * état.
 */
export const Checkbox = forwardRef(
  (
    {
      label,
      state,
      message,
      containerClassname,
      labelClassname,
      variant = 'checkbox',
      id,
      size = 'md',
      ...remainingProps
    }: CheckboxProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const Input = variant === 'checkbox' ? InputCheckbox : InputSwitch;

    return (
      <div className={cn('flex gap-2 min-w-min', containerClassname)}>
        <Input
          ref={ref}
          id={inputId}
          {...remainingProps}
          className={cn('cursor-pointer', remainingProps.className)}
        />
        <div
          className={cn('flex flex-col gap-1', {
            '-mt-0.5': variant === 'checkbox',
            'mt-0.25': size === 'sm' && variant === 'checkbox',
            'mt-0.5': size === 'sm' && variant === 'switch',
          })}
        >
          {label && (
            /** affiche l'input et le libellé */
            <label
              htmlFor={inputId}
              className={cn(
                'inline-flex items-center cursor-pointer ml-0',
                {
                  'text-primary-9': !remainingProps.disabled,
                  'text-grey-6': remainingProps.disabled,
                  'text-sm': size === 'sm',
                },
                labelClassname
              )}
            >
              {label}
            </label>
          )}
          {/** Message complémentaire */}
          <FieldMessage
            state={state}
            message={message}
            messageClassName="my-auto"
          />
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
