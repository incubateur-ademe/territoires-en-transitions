import { Tag } from '@/backend/collectivites';
import { SelectMultipleProps } from '@/ui';
import SelectTags from '../tags/SelectTags';
import { useLibreTagsListe } from './useLibreTagsListe';

type LibreTagsDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({ tags, selectedTag }: { tags: Tag[]; selectedTag: Tag }) => void;
  disabledOptionsIds?: number[];
};

const LibreTagsDropdown = (props: LibreTagsDropdownProps) => {
  const { data, refetch } = useLibreTagsListe();

  return (
    <SelectTags
      {...props}
      dataTest={props.dataTest ?? 'LibreTag'}
      queryKey="libre_tags"
      tagTableName="libre_tag"
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          tags: values,
          selectedTag: selectedValue,
        });
      }}
    />
  );
};

export default LibreTagsDropdown;
