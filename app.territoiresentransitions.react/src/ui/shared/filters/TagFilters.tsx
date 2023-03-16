import {ChangeEvent, Fragment, useState} from 'react';
import './TagFilters.css';

type TagFiltersProps = {
  name: string;
  options: string[];
  defaultOption?: string;
  className?: string;
  onChange: (value: string) => void;
};

const TagFilters = ({
  name,
  options,
  defaultOption,
  className = '',
  onChange,
}: TagFiltersProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    defaultOption ?? null
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
    onChange(event.target.value);
  };

  return (
    <div className={`flex flex-wrap gap-4 ${className} tag-filters`}>
      {[defaultOption, ...options].map(opt => (
        <Fragment key={opt}>
          <input
            type="radio"
            name={name}
            id={opt}
            value={opt}
            checked={selectedOption === opt}
            onChange={handleChange}
          />
          <label htmlFor={opt}>
            {opt}
            <span
              className="fr-fi-checkbox-circle-line scale-75"
              aria-hidden="true"
            ></span>
          </label>
        </Fragment>
      ))}
    </div>
  );
};

export default TagFilters;
