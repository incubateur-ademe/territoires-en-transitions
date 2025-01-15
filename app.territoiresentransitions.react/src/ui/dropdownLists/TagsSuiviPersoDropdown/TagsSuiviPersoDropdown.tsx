import { Tag } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import SelectTags from '../tags/SelectTags';
import { useTagsSuiviPersoListe } from './useTagsSuiviPersoListe';
import { QueryKey } from 'react-query';

type TagsSuiviPersoDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
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
  const { data, refetch } = useTagsSuiviPersoListe();

  return (
    <SelectTags
      {...props}
      placeholder={props.placeholder ?? 'Créez un tag de suivi personnalisé'}
      queryKey="tags_suivi_perso"
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
