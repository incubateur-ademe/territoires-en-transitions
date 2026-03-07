import { TagEnum, TagWithCollectiviteId } from '@tet/domain/collectivites';
import { SelectMultipleProps } from '@tet/ui';
import { SelectTagsCombobox } from './select-tags.combobox';
import { useListTags } from './use-list-tags';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
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
};

const SelectStructuresCombobox = (props: Props) => {
  const { data, refetch } = useListTags({
    tagType: TagEnum.Structure,
    collectiviteIds: props.collectiviteIds,
  });

  return (
    <SelectTagsCombobox
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${
          isEditionAllowed ? 'ou créer ' : ''
        }une structure pilote`
      }
      tagType={TagEnum.Structure}
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

export default SelectStructuresCombobox;
