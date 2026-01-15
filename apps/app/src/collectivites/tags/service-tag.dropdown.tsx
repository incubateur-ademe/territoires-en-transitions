import { TagEnum } from '@tet/domain/collectivites';
import { TagDropdown, TagDropdownProps } from './tag.dropdown';
import { useListServices } from './use-list-services';

type Props = Omit<
  TagDropdownProps,
  'options' | 'optionsListe' | 'placeholder' | 'tagType' | 'refetchOptions'
> & {
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
};

const ServiceTagDropdown = ({ collectiviteIds, onChange, ...props }: Props) => {
  const { data, refetch } = useListServices({
    collectiviteIds,
  });

  return (
    <TagDropdown
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${
          isEditionAllowed ? 'ou créer ' : ''
        }une direction ou service pilote`
      }
      tagType={TagEnum.Service}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={onChange}
    />
  );
};

export default ServiceTagDropdown;
