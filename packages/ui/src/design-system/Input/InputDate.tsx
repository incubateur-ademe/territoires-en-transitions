import classNames from 'classnames';
import { forwardRef, useRef } from 'react';
import { InputBase, InputBaseProps } from './InputBase';

export type InputDateProps = Omit<InputBaseProps, 'icon' | 'type'>;

/**
 * Affiche un champ de saisie date
 */
export const InputDate = forwardRef<HTMLInputElement, InputDateProps>(
  ({ className, containerClassname, ...props }: InputDateProps, maybeRef?) => {
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
          /** cache l'indicateur natif, remplacé par le bouton ci-dessous ; les
           * navigateurs qui ne connaissent pas ce pseudo-élément gardent le
           * leur et masquent le bouton (cf. `.input-date` dans global.css) */
          '[&::-webkit-calendar-picker-indicator]:hidden',
          className
        )}
        containerClassname={classNames('input-date', containerClassname)}
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
InputDate.displayName = 'InputDate';
