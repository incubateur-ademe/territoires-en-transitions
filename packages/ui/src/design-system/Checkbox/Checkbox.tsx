import { Ref, forwardRef, useId } from 'react';

import { cn } from '@/ui/utils/cn';
import { FieldMessage, FieldMessageProps } from '../Field';

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
      className,
      containerClassname,
      labelClassname,
      variant = 'checkbox',
      id,
      checked,
      onChange,
      readOnly,
      ...remainingProps
    }: CheckboxProps,
    ref?: Ref<HTMLInputElement>
  ) => {
    const inputId = id ?? useId();

    return (
      <div
        className={cn('flex gap-2 min-w-min items-center', containerClassname)}
      >
        <input
          id={inputId}
          type="checkbox"
          ref={ref}
          checked={checked ?? false}
          readOnly={readOnly ?? !onChange}
          onChange={onChange}
          className={cn(
            // styles communs
            '!appearance-none shrink-0 checked:before:icon-check-line checked:bg-primary checked:disabled:bg-primary-5',
            {
              /** Checkbox */
              'flex content-center justify-center mt-0.5 border border-solid !border-grey-6 rounded flex-wrap w-5 h-5 !text-white  checked:!border-transparent checked:hover:bg-primary-8 checked:!disabled:border-grey-4':
                variant === 'checkbox',

              /** Switch */
              'relative bg-grey-4 rounded-full w-10 h-6 before:absolute before:h-4 before:w-4 before:left-1 before:top-1 before:bg-white before:duration-200 before:rounded-full checked:text-primary checked:before:translate-x-4 checked:before:flex checked:before:items-center checked:before:justify-center':
                variant === 'switch',
            },

            className
          )}
          {...remainingProps}
        />
        <div className="flex flex-col gap-1">
          {label && (
            /** affiche l'input et le libellé */
            <label
              htmlFor={inputId}
              className={cn(
                'inline-flex items-center cursor-pointer ml-0 font-medium',
                {
                  'text-grey-8': !remainingProps.disabled,
                  'text-grey-6': remainingProps.disabled,
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
