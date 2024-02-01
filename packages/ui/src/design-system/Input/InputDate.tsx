import {Ref, forwardRef, useImperativeHandle, useRef} from 'react';
import classNames from 'classnames';
import {InputBase, InputBaseProps} from './InputBase';

export type InputDateProps = Omit<InputBaseProps, 'icon' | 'type'>;

/**
 * Affiche un champ de saisie date
 */
export const InputDate = forwardRef(
  ({className, ...props}: InputDateProps, ref?: Ref<HTMLInputElement>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current);

    return (
      <InputBase
        type="date"
        ref={inputRef}
        className={classNames(
          /** cache l'icône du sélecteur de date (fonctionne uniquement pour chrome et probablement edge mais pas pour firefox ni safari) */
          '[&::-webkit-calendar-picker-indicator]:hidden',
          className
        )}
        icon={{
          buttonProps: {
            type: 'button',
            icon: 'calendar-line',
            onClick: () => {
              inputRef.current?.showPicker();
            },
          },
        }}
        {...props}
      />
    );
  }
);
