import {useId} from '@floating-ui/react';
import {ChangeEvent, Fragment, useEffect, useState} from 'react';
import './TagFilters.css';

type TagFiltersProps = {
  name: string;
  options: {value: string; label: string}[];
  defaultOption?: string;
  className?: string;
  small?: boolean;
  onChange: (value: string) => void;
};

const TagFilters = ({
  name,
  options,
  defaultOption = 'default',
  className = '',
  small = false,
  onChange,
}: TagFiltersProps) => {
  const [selectedOption, setSelectedOption] = useState<string>(defaultOption);
  const id = useId();

  useEffect(() => {
    setSelectedOption(defaultOption);
  }, [defaultOption]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
    onChange(event.target.value);
  };

  return (
    <div className={`flex flex-wrap gap-4 ${className} tag-filters`}>
      {options.map(opt => (
        <Fragment key={opt.value}>
          <input
            className="hidden"
            type="radio"
            name={`${name}-${id}`}
            id={opt.value}
            value={opt.value}
            checked={selectedOption === opt.value}
            onChange={handleChange}
          />
          <label
            htmlFor={opt.value}
            className={`block relative m-0 px-4 py-1 rounded-2xl ${
              small ? 'text-xs' : 'text-sm'
            } text-bf500 bg-bf925 hover:bg-bf925hover cursor-pointer`}
          >
            {opt.label}
            <span
              className={`fr-fi-checkbox-circle-line ${
                small ? 'scale-[.6]' : 'scale-75'
              } hidden`}
              aria-hidden="true"
            ></span>
          </label>
        </Fragment>
      ))}
    </div>
  );
};

export default TagFilters;
