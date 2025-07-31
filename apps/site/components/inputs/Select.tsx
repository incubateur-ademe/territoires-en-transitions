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
      <label
        className="fr-label text-grey-8 text-[16px] font-[500]"
        htmlFor={name}
      >
        {label}
      </label>
      <select
        onChange={e => onChange(e.target.value)}
        value={value}
        className="fr-select bg-grey-1 text-grey-8 text-[14px] border border-grey-4 rounded-[10px] h-[50px] shadow-none outline-none"
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
