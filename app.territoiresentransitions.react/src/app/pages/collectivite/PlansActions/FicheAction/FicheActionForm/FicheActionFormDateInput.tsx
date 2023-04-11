import {InputHTMLAttributes, useEffect, useState} from 'react';
import {format, isValid} from 'date-fns';

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
    const d = initialValue ? new Date(initialValue) : undefined;
    setValue(d && isValid(d) ? format(d, 'yyyy-MM-dd') : '');
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
