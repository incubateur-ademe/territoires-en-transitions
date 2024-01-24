import {useRef} from 'react';
import {InputBase, InputBaseProps} from './InputBase';
import './InputDate.css';

export type InputDateProps = Omit<InputBaseProps, 'icon' | 'type'>;

/**
 * Affiche un champ de saisie date
 */
export const InputDate = (props: InputDateProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <InputBase
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
