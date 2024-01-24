import {useRef} from 'react';
import {Input, InputProps} from './Input';
import './InputDate.css';

export type InputDateProps = Omit<InputProps, 'icon' | 'type'>;

/**
 * Affiche un champ de saisie date
 */
export const InputDate = (props: InputDateProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Input
      type="date"
      ref={inputRef}
      className="input-date"
      icon={{
        buttonProps: {
          icon: 'calendar-line',
          onClick: () => {
            inputRef.current?.showPicker();
          },
        },
      }}
      {...props}
    />
  );
};
