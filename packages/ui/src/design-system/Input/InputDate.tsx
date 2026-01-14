import classNames from 'classnames';
import { forwardRef, useRef } from 'react';
import { InputBase, InputBaseProps } from './InputBase';

export type InputDateProps = Omit<InputBaseProps, 'icon' | 'type'>;

/**
 * Affiche un champ de saisie date
 */
export const InputDate = forwardRef<HTMLInputElement, InputDateProps>(
  ({ className, ...props }: InputDateProps, maybeRef?) => {
    const innerRef = useRef<HTMLInputElement | null>(null);
    return (
      <InputBase
        type="date"
        ref={(inputRef) => {
          innerRef.current = inputRef;
          if (!maybeRef) {
            return;
          }
          if (typeof maybeRef === 'function') {
            maybeRef(inputRef);
          } else {
            maybeRef.current = inputRef;
          }
        }}
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
              innerRef.current?.showPicker();
            },
          },
        }}
        {...props}
      />
    );
  }
);
