import { Tag } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import { QueryKey } from 'react-query';
import SelectTags from '../tags/SelectTags';
import { useStructuresListe } from './useStructuresListe';

type StructuresDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
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
  const { data, refetch } = useStructuresListe(props.collectiviteIds);

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
