import { TagEnum } from '@tet/domain/collectivites';
import {
  SelectTagsCombobox,
  SelectTagsComboboxProps,
} from './select-tags.combobox';
import { useListLibreTags } from './use-list-libre-tags';

type Props = Omit<
  SelectTagsComboboxProps,
  'options' | 'tagType' | 'refetchOptions'
> & {
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
};

const SelectLibreTagsCombobox = (props: Props) => {
  const { data, refetch } = useListLibreTags({
    collectiviteIds: props.collectiviteIds,
  });

  return (
    <SelectTagsCombobox
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}un tag`
      }
      tagType={TagEnum.Libre}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          values,
          selectedValue,
        });
      }}
    />
  );
};

export default SelectLibreTagsCombobox;
