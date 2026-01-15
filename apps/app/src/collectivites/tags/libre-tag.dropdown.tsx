import { TagEnum } from '@tet/domain/collectivites';
import { TagDropdown, TagDropdownProps } from './tag.dropdown';
import { useListLibreTags } from './use-list-libre-tags';

type Props = Omit<
  TagDropdownProps,
  'options' | 'tagType' | 'refetchOptions'
> & {
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
};

export const LibreTagDropdown = ({
  collectiviteIds,
  onChange,
  ...props
}: Props) => {
  const { data, refetch } = useListLibreTags({
    collectiviteIds,
  });

  return (
    <TagDropdown
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}un tag`
      }
      tagType={TagEnum.Libre}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        onChange({
          values,
          selectedValue,
        });
      }}
    />
  );
};
