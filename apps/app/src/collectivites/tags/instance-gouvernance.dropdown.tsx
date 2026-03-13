import { TagEnum } from '@tet/domain/collectivites';
import {
  SelectTagsCombobox,
  SelectTagsComboboxProps,
} from './select-tags.combobox';
import { useListTags } from './use-list-tags';

type Props = Omit<
  SelectTagsComboboxProps,
  'options' | 'tagType' | 'refetchOptions'
> & {
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
};

export const SelectInstanceGouvernanceCombobox = (props: Props) => {
  const { data, refetch } = useListTags({
    tagType: TagEnum.InstanceGouvernance,
    collectiviteIds: props.collectiviteIds,
  });

  return (
    <SelectTagsCombobox
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${
          isEditionAllowed ? 'ou créer ' : ''
        }une instance de gouvernance`
      }
      tagType={TagEnum.InstanceGouvernance}
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
