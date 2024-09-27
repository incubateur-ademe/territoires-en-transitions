import classNames from 'classnames';
import { ForwardedRef, MutableRefObject, forwardRef } from 'react';
import { InputBase, InputBaseProps } from './InputBase';

export type InputDateProps = Omit<InputBaseProps, 'icon' | 'type'>;

/**
 * Affiche un champ de saisie date
 */
export const InputDate = forwardRef(
  (
    { className, ...props }: InputDateProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <InputBase
        type="date"
        ref={ref}
        className={classNames(
          /** cache l'icône du sélecteur de date (fonctionne uniquement pour chrome et probablement edge mais pas pour firefox ni safari) */
          '[&::-webkit-calendar-picker-indicator]:hidden',
          className
        )}
        icon={{
          buttonProps: {
            type: 'button',
            icon: 'calendar-2-line',
            onClick: () => {
              (ref as MutableRefObject<HTMLInputElement>).current.showPicker();
            },
          },
        }}
        {...props}
      />
    );
  }
);
