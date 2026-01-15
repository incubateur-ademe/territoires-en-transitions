import { TagEnum } from '@tet/domain/collectivites';
import { TagDropdown, TagDropdownProps } from './tag.dropdown';
import { useListFinanceurs } from './use-list-financeurs';

type Props = Omit<
  TagDropdownProps,
  'options' | 'optionsListe' | 'placeholder' | 'tagType' | 'refetchOptions'
> & {
  /**
   * Si spécifié, on récupère les financeurs de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
};

const FinanceurTagDropdown = ({
  collectiviteIds,
  onChange,
  ...props
}: Props) => {
  const { data, refetch } = useListFinanceurs({
    collectiviteIds,
  });

  return (
    <TagDropdown
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}un financeur`
      }
      tagType={TagEnum.Financeur}
      optionsListe={data}
      userCreatedOptionsIds={(data ?? [])
        .map((d) => d.id)
        .filter((d) => !props.disabledOptionsIds?.includes(d))}
      refetchOptions={refetch}
      onChange={onChange}
    />
  );
};

export default FinanceurTagDropdown;
