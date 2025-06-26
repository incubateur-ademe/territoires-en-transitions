import { Tag } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import { QueryKey } from '@tanstack/react-query';
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
  additionalKeysToInvalidate?: QueryKey[];
};

const PartenairesDropdown = (props: PartenairesDropdownProps) => {
  const { data, refetch } = usePartenairesListe();

  return (
    <SelectTags
      {...props}
      placeholder={props.placeholder ?? 'Sélectionnez ou créez un partenaire'}
      queryKey={['partenaires']}
      tagTableName="partenaire_tag"
      additionalKeysToInvalidate={props.additionalKeysToInvalidate}
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
