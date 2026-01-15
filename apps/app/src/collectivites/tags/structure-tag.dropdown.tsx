import { TagEnum } from '@tet/domain/collectivites';
import { TagDropdown, TagDropdownProps } from './tag.dropdown';
import { useListTags } from './use-list-tags';

type Props = Omit<
  TagDropdownProps,
  'options' | 'optionsListe' | 'placeholder' | 'tagType' | 'refetchOptions'
> & {
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
};

export const StructureTagDropdown = ({
  collectiviteIds,
  onChange,
  ...props
}: Props) => {
  const { data, refetch } = useListTags({
    tagType: TagEnum.Structure,
    collectiviteIds,
  });

  return (
    <TagDropdown
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${
          isEditionAllowed ? 'ou créer ' : ''
        }une structure pilote`
      }
      tagType={TagEnum.Structure}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={onChange}
    />
  );
};
