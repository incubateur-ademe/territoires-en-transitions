import { QueryKey } from '@tanstack/react-query';
import { Tag } from '@tet/domain/collectivites';
import { SelectMultipleProps } from '@tet/ui';
import SelectTags from '../tags/SelectTags';
import { useTagsSuiviPersoListe } from './useTagsSuiviPersoListe';

type TagsSuiviPersoDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
  onChange: ({
    libresTag,
    selectedLibreTag,
  }: {
    libresTag: Tag[];
    selectedLibreTag: Tag;
  }) => void;
  additionalKeysToInvalidate?: QueryKey[];
};

const TagsSuiviPersoDropdown = (props: TagsSuiviPersoDropdownProps) => {
  const { data, refetch } = useTagsSuiviPersoListe(props.collectiviteIds);

  return (
    <SelectTags
      {...props}
      placeholder={(isEditionAllowed) =>
        `Sélectionner ${isEditionAllowed ? 'ou créer ' : ''}un tag`
      }
      queryKey={['tags_suivi_perso']}
      tagTableName="libre_tag"
      additionalKeysToInvalidate={props.additionalKeysToInvalidate}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          libresTag: values,
          selectedLibreTag: selectedValue,
        });
      }}
    />
  );
};

export default TagsSuiviPersoDropdown;
