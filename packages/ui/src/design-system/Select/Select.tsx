import { SelectBase, SelectProps } from './components/SelectBase';
import { OptionValue } from './utils';

type Props = Omit<
  SelectProps,
  'onChange' | 'isBadgeSelect' | 'valueToBadgeState'
> & {
  /** Permet de renvoyer undefined si l'option cliquée est déjà la valeur sélectionnée.
   * Cela permet de ne pas avoir à faire de traitement côté parent pour gérer la déselection d'une option.
   */
  onChange: (value?: OptionValue) => void;
};

/**
 * Sélecteur de valeur unique
 *
 * Ajouter `isSearcheable`, `createProps` ou `onSearch` pour faire un Searchable select
 */
export const Select = ({ values, onChange, ...props }: Props) => {
  return (
    <SelectBase
      {...props}
      //values sera toujours un OptionValue simple sans tableau
      onChange={(v) => onChange(v !== values ? v : undefined)}
      values={values}
    />
  );
};
