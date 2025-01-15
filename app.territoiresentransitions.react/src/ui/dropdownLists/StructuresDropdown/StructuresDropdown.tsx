import { Tag } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import SelectTags from '../tags/SelectTags';
import { useStructuresListe } from './useStructuresListe';
import { QueryKey } from 'react-query';

type StructuresDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({
    structures,
    selectedStructure,
  }: {
    structures: Tag[];
    selectedStructure: Tag;
  }) => void;
  additionalKeysToInvalidate?: QueryKey[];
};

const StructuresDropdown = (props: StructuresDropdownProps) => {
  const { data, refetch } = useStructuresListe();

  return (
    <SelectTags
      {...props}
      placeholder={props.placeholder ?? 'Sélectionnez ou créez un pilote'}
      queryKey="structures"
      tagTableName="structure_tag"
      additionalKeysToInvalidate={props.additionalKeysToInvalidate}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          structures: values,
          selectedStructure: selectedValue,
        });
      }}
    />
  );
};

export default StructuresDropdown;
