import {InputHTMLAttributes, useState} from 'react';
import {format} from 'date-fns';

type Props<T> = {
  initialValue?: string | null;
} & InputHTMLAttributes<T>;

const FicheActionFormDateInput = <T extends HTMLInputElement>({
  initialValue,
  onBlur,
}: Props<T>) => {
  const [value, setValue] = useState(
    initialValue ? format(new Date(initialValue), 'yyyy-MM-dd') : undefined
  );
  return (
    <div className="fr-input-wrap fr-fi-calendar-line">
      <input
        type="date"
        className="fr-input w-full p-2"
        pattern="\d{4}-\d{2}-\d{2}"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
};

export default FicheActionFormDateInput;
