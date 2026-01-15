import { TagEnum } from '@tet/domain/collectivites';
import { TagDropdown, TagDropdownProps } from './tag.dropdown';
import { useListPartenaires } from './use-list-partenaires';

type Props = Omit<
  TagDropdownProps,
  'options' | 'optionsListe' | 'placeholder' | 'tagType' | 'refetchOptions'
> & {
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
};

export const PartenaireTagDropdown = ({
  collectiviteIds,
  onChange,
  ...props
}: Props) => {
  const { data, refetch } = useListPartenaires({
    collectiviteIds,
  });

  return (
    <TagDropdown
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}un partenaire`
      }
      tagType={TagEnum.Partenaire}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={onChange}
    />
  );
};

export default PartenaireTagDropdown;
