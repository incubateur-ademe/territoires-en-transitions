import { SelectBase, SelectProps } from './components/SelectBase';

/**
 * Sélecteur de valeur unique
 *
 * Ajouter `isSearcheable`, `createProps` ou `onSearch` pour faire un Searchable select
 */
export const Select = ({ values, onChange, ...props }: SelectProps) => {
  return (
    <SelectBase
      {...props}
      //values sera toujours un OptionValue simple sans tableau
      onChange={(v) => onChange(v !== values ? v : '')}
      values={values}
    />
  );
};
