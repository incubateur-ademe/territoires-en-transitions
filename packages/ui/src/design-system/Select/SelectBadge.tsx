import { SelectBase, SelectProps } from './components/SelectBase';
import { OptionValue } from './utils';

type Props = Omit<
  SelectProps,
  | 'onChange'
  | 'onSearch'
  | 'isSearcheable'
  | 'multiple'
  | 'createProps'
  | 'placeholder'
  | 'customItem'
> & {
  /** Le select doit forcément avoir une valeur définie */
  defaultValue: OptionValue;
  /** Surcouche de la prop onChange - Ajoute une condition required au select */
  onChange: (value?: OptionValue) => void;
};

/**
 * Sélecteur de valeur unique pour les listes de badges métier
 **/
export const SelectBadge = ({
  defaultValue,
  values,
  onChange,
  ...props
}: Props) => {
  const handleChange = (newValue: OptionValue) => {
    // Ne change pas la valeur si même valeur que précédemment
    // => toujours une valeur sélectionnée
    if (newValue !== values) onChange(newValue);
  };

  return (
    <SelectBase
      isBadgeSelect
      containerWidthMatchButton={false}
      values={values ?? defaultValue}
      onChange={handleChange}
      {...props}
    />
  );
};
