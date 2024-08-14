import {Indicateurs} from '@tet/api';
import {Select, SelectProps} from '@tet/ui';
import {getCategorieLabel} from './utils';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: Indicateurs.CategorieProgramme[];
  onChange: (value?: Indicateurs.CategorieProgramme) => void;
};

const IndicateurCategoriesDropdown = (props: Props) => {
  return (
    <Select
      {...props}
      options={Indicateurs.domain.categorieProgrammeEnumSchema.options.map(
        categorie => ({
          label: getCategorieLabel(categorie),
          value: categorie,
        })
      )}
      onChange={value => {
        props.onChange(value as Indicateurs.CategorieProgramme);
      }}
    />
  );
};

export default IndicateurCategoriesDropdown;
