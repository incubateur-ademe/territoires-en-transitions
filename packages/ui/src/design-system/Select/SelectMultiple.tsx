import { SelectBase, SelectProps } from './components/SelectBase';
import { OptionValue } from './utils';

export type SelectMultipleOnChangeArgs = {
  selectedValue: OptionValue;
  values?: OptionValue[];
};

export type SelectMultipleProps = Omit<
  SelectProps,
  'onChange' | 'values' | 'isBadgeSelect' | 'valueToBadgeState'
> & {
  /**
   * Appelée à la sélection d'une option.
   * Reçoit la valeur de l'option cliquée,
   * ainsi que la liste de toutes les valeurs sélectionnées finale.
   * */
  onChange: (args: SelectMultipleOnChangeArgs) => void;
  /** Valeurs sélectionnées */
  values?: OptionValue[];
  /**
   * Nombre maximum de badges à afficher
   * @deprecated Peut entrainer des problèmes d'affichage pour des valeurs avec beaucoup de texte ou des selecteurs pas très large. Déconseillé de mettre une value supérieure à 1 tant que ce n'est pas géré correctement.
   */
  maxBadgesToShow?: number;
  optionsAreCaseSensitive?: boolean;
};
/**
 * Sélecteur de valeur multiple
 *
 * Ajouter `isSearcheable`, `createProps` ou `onSearch` pour faire un Searchable select
 */
export const SelectMultiple = ({
  values,
  onChange,
  maxBadgesToShow,
  optionsAreCaseSensitive = true,
  ...props
}: SelectMultipleProps) => {
  return (
    <SelectBase
      {...props}
      onChange={(v) => {
        let allValues = values;

        if (allValues) {
          if (allValues.includes(v)) {
            // retrait d'une valeur
            // renvoie undefined si la seule valeur présente dans les valeurs du sélecteur est la même que la valeur de l'option
            allValues =
              allValues.length === 1
                ? undefined
                : allValues.filter((val) => val !== v);
          } else {
            // ajoût d'une valeur
            allValues = [...allValues, v];
          }
          // si aucune valeur n'était déjà sélectionnée alors on renvoie directement la valeur de l'option dans un tableau
        } else {
          allValues = [v];
        }
        onChange({ selectedValue: v, values: allValues });
      }}
      multiple
      values={values}
      maxBadgesToShow={maxBadgesToShow}
      optionsAreCaseSensitive={optionsAreCaseSensitive}
    />
  );
};
