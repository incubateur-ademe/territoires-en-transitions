import {Indicateurs} from '@tet/api';
import {SelectFilter, SelectProps} from '@tet/ui';
import {getCategorieLabel} from './utils';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: Indicateurs.CategorieProgramme[];
  onChange: ({
    categories,
    selectedCategorie,
  }: {
    categories: Indicateurs.CategorieProgramme[];
    selectedCategorie: Indicateurs.CategorieProgramme;
  }) => void;
};

const IndicateurCategoriesDropdown = (props: Props) => {
  return (
    <SelectFilter
      {...props}
      options={Indicateurs.domain.categorieProgrammeEnumSchema.options.map(
        categorie => ({
          label: getCategorieLabel(categorie),
          value: categorie,
        })
      )}
      onChange={({values, selectedValue}) => {
        props.onChange({
          categories: values as Indicateurs.CategorieProgramme[],
          selectedCategorie: selectedValue as Indicateurs.CategorieProgramme,
        });
      }}
    />
  );
};

export default IndicateurCategoriesDropdown;
