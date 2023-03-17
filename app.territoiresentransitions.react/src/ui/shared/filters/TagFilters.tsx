import {ChangeEvent, Fragment, useState} from 'react';
import './TagFilters.css';

type TagFiltersProps = {
  name: string;
  options: {id: string; name: string}[];
  className?: string;
  onChange: (id: string) => void;
};

const TagFilters = ({
  name,
  options,
  className = '',
  onChange,
}: TagFiltersProps) => {
  const [selectedOption, setSelectedOption] = useState<string>('default');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
    onChange(event.target.value);
  };

  return (
    <div className={`flex flex-wrap gap-4 ${className} tag-filters`}>
      {options.map(opt => (
        <Fragment key={opt.id}>
          <input
            type="radio"
            name={name}
            id={opt.id}
            value={opt.id}
            checked={selectedOption === opt.id}
            onChange={handleChange}
          />
          <label htmlFor={opt.id}>
            {opt.name}
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
