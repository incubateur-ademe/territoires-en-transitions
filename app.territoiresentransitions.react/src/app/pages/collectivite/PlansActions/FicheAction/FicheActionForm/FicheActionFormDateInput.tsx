import {InputHTMLAttributes, useEffect, useState} from 'react';
import {format} from 'date-fns';

type Props<T> = {
  initialValue?: string | null;
} & InputHTMLAttributes<T>;

const FicheActionFormDateInput = <T extends HTMLInputElement>({
  initialValue,
  disabled,
  onBlur,
  ...props
}: Props<T>) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(initialValue ? format(new Date(initialValue), 'yyyy-MM-dd') : '');
  }, [initialValue]);

  return (
    <div className="fr-input-wrap fr-fi-calendar-line">
      <input
        type="date"
        className="fr-input w-full p-2"
        pattern="\d{4}-\d{2}-\d{2}"
        value={value ?? ''}
        onChange={e => {
          setValue(e.target.value);
        }}
        onBlur={onBlur}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

export default FicheActionFormDateInput;
