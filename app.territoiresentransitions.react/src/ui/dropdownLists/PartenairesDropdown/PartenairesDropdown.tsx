import { Tag } from '@tet/api/shared/domain';
import { SelectMultipleProps } from '@tet/ui';
import SelectTags from '../tags/SelectTags';
import { usePartenairesListe } from './usePartenairesListe';

type PartenairesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({
    partenaires,
    selectedPartenaire,
  }: {
    partenaires: Tag[];
    selectedPartenaire: Tag;
  }) => void;
};

const PartenairesDropdown = (props: PartenairesDropdownProps) => {
  const { data, refetch } = usePartenairesListe();

  return (
    <SelectTags
      {...props}
      placeholder={props.placeholder ?? 'Sélectionnez ou créez un partenaire'}
      queryKey="partenaires"
      tagTableName="partenaire_tag"
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          partenaires: values,
          selectedPartenaire: selectedValue,
        });
      }}
    />
  );
};

export default PartenairesDropdown;
