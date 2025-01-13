import { Tag } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import SelectTags from '../tags/SelectTags';
import { useStructuresListe } from './useStructuresListe';

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
  onTagEdit?: (editedTag: Tag) => void;
};

const StructuresDropdown = (props: StructuresDropdownProps) => {
  const { data, refetch } = useStructuresListe();

  return (
    <SelectTags
      {...props}
      placeholder={props.placeholder ?? 'Sélectionnez ou créez un pilote'}
      queryKey="structures"
      tagTableName="structure_tag"
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          structures: values,
          selectedStructure: selectedValue,
        });
      }}
      onTagEdit={props.onTagEdit}
    />
  );
};

export default StructuresDropdown;
