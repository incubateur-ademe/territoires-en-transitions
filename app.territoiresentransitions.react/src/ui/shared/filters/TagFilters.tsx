import {useEffect, useState} from 'react';
import MultiTagFilters from './MultiTagFilters';
import {ITEM_ALL} from './commons';

type TOption = {value: string; label: string};

type TagFiltersProps = {
  options: TOption[];
  defaultOption?: string;
  className?: string;
  small?: boolean;
  onChange: (value: string) => void;
};

/**
 * Ensemble de boutons sous formes de tags
 * Permet de mettre en place un filtre avec une seule valeur sélectionnée
 *
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
  options,
  defaultOption = ITEM_ALL,
  className = '',
  small = false,
  onChange,
}: TagFiltersProps) => {
  const [selectedOption, setSelectedOption] = useState<string>(defaultOption);

  useEffect(() => {
    setSelectedOption(defaultOption);
  }, [defaultOption]);

  return (
    <MultiTagFilters
      onChange={value => {
        setSelectedOption(value);
        onChange(value);
      }}
      options={options}
      className={className}
      values={[selectedOption]}
      small={small}
    />
  );
};

export default TagFilters;
