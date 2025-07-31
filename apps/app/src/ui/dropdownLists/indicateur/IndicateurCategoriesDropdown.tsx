import { Indicateurs } from '@/api';
import { SelectFilter, SelectProps } from '@/ui';
import { useCategorieTags } from './use-categorie-tags';
import { getCategorieLabel } from './utils';

type Props = Omit<SelectProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: ({
    categories,
    selectedCategorie,
  }: {
    categories: string[];
    selectedCategorie: string;
  }) => void;
};

const IndicateurCategoriesDropdown = (props: Props) => {
  const { data: categories } = useCategorieTags();
  return (
    categories && (
      <SelectFilter
        {...props}
        options={categories.map((categorie) => ({
          label: getCategorieLabel(categorie.nom),
          value: categorie.nom,
        }))}
        onChange={({ values, selectedValue }) => {
          props.onChange({
            categories: values as Indicateurs.CategorieProgramme[],
            selectedCategorie: selectedValue as Indicateurs.CategorieProgramme,
          });
        }}
      />
    )
  );
};

export default IndicateurCategoriesDropdown;
