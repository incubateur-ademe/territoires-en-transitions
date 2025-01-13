import { Tag } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import SelectTags from '../tags/SelectTags';
import { useTagsSuiviPersoListe } from './useTagsSuiviPersoListe';

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
  onTagEdit?: (editedTag: Tag) => void;
};

const TagsSuiviPersoDropdown = (props: TagsSuiviPersoDropdownProps) => {
  const { data, refetch } = useTagsSuiviPersoListe();

  return (
    <SelectTags
      {...props}
      placeholder={props.placeholder ?? 'Créez un tag de suivi personnalisé'}
      queryKey="tags_suivi_perso"
      tagTableName="libre_tag"
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          libresTag: values,
          selectedLibreTag: selectedValue,
        });
      }}
      onTagEdit={props.onTagEdit}
    />
  );
};

export default TagsSuiviPersoDropdown;
