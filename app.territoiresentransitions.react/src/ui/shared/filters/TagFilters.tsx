import {ChangeEvent, Fragment, useEffect, useState} from 'react';
import './TagFilters.css';

type TagFiltersProps = {
  name: string;
  id?: string;
  options: {value: string; label: string}[];
  defaultOption?: string;
  className?: string;
  small?: boolean;
  onChange: (value: string) => void;
};
/**
 * Ensemble de radio buttons sous formes de tags
 * Permet de mettre en place un filtre avec une seule valeur sélectionnée
 *
 * @param name
 * Nom associé au groupe de radio buttons
 * @param id
 * Identifiant supplémentaire lorsque plusieurs éléments avec le même nom sont sur la page (optionnel)
 * @param options
 * Options disponibles dans le filtre
 * @param defaultOption
 * Option à sélectionner par défaut (optionnel, par défaut à "default")
 * @param className
 * Classname custom à appliquer sur le container du filtre (optionnel)
 * @param small
 * Affichage xs des tags (optionnel, par défaut à "false")
 * @param onChange
 * Renvoie la valeur sélectionnée
 */

const TagFilters = ({
  name,
  id,
  options,
  defaultOption = 'default',
  className = '',
  small = false,
  onChange,
}: TagFiltersProps) => {
  const [selectedOption, setSelectedOption] = useState<string>(defaultOption);

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
            name={`${name}${id ? `-${id}` : ''}`}
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
