import { Tag } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import { QueryKey } from '@tanstack/react-query';
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
      placeholder={props.placeholder ?? 'Créez un tag de suivi personnalisé'}
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
