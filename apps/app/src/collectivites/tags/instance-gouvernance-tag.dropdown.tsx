import { appLabels } from '@/app/labels/catalog';
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

export const InstanceGouvernanceTagDropdown = ({
  collectiviteIds,
  onChange,
  ...props
}: Props) => {
  const { data, refetch } = useListTags({
    tagType: TagEnum.InstanceGouvernance,
    collectiviteIds,
  });

  return (
    <TagDropdown
      {...props}
      placeholder={(isEditionAllowed) =>
        appLabels.ficheInstanceGouvernancePlaceholderSelectionner(
          isEditionAllowed
        )
      }
      tagType={TagEnum.InstanceGouvernance}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={onChange}
    />
  );
};
