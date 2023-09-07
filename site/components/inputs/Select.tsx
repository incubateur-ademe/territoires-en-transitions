import {CSSProperties} from 'react';

type SelectProps = {
  name: string;
  label: string;
  emptyOptionLabel?: string;
  options: {
    value: string | number | undefined;
    name: string | number | undefined;
  }[];
  value: string;
  style?: CSSProperties;
  onChange: (newValue: string) => void;
};

const Select = ({
  name,
  label,
  emptyOptionLabel,
  options,
  value,
  style,
  onChange,
}: SelectProps) => {
  return (
    <div style={style}>
      <label className="fr-label" htmlFor={name}>
        {label}
      </label>
      <select
        onChange={e => onChange(e.target.value)}
        value={value}
        className="fr-select"
        id={name}
        name={name}
      >
        <option value={''} key="none">
          {emptyOptionLabel ?? 'Sélectionnez une option'}
        </option>
        {options.map(opt => (
          <option value={opt.value} key={opt.value}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
