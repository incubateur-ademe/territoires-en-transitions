import { QueryKey } from '@tanstack/react-query';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { SelectMultipleProps } from '@tet/ui';
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
    structures: TagWithCollectiviteId[];
    selectedStructure: TagWithCollectiviteId;
  }) => void;
  additionalKeysToInvalidate?: QueryKey[];
};

const StructuresDropdown = (props: StructuresDropdownProps) => {
  const { data, refetch } = useStructuresListe(props.collectiviteIds);

  return (
    <SelectTags
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${
          isEditionAllowed ? 'ou créer ' : ''
        }une structure pilote`
      }
      queryKey={['structures']}
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
