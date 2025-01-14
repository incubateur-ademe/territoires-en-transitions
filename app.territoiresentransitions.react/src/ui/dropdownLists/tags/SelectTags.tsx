import { TableTag } from '@/api';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { Tag } from '@/domain/collectivites';
import { Option, OptionValue, SelectFilter, SelectMultipleProps } from '@/ui';
import { useEffect } from 'react';
import { QueryKey } from 'react-query';
import { useDeleteTag, useTagCreate, useTagUpdate } from '.';

type SelectTagsProps = Omit<SelectMultipleProps, 'options' | 'onChange'> & {
  queryKey: QueryKey;
  tagTableName: TableTag;
  optionsListe?: Tag[];
  userCreatedOptionsIds?: number[];
  disabledOptionsIds?: number[];
  refetchOptions: () => void;
  onChange: ({
    values,
    selectedValue,
  }: {
    values: Tag[];
    selectedValue: Tag;
  }) => void;
  onTagEdit?: (editedTag: Tag) => void;
};

const SelectTags = ({
  queryKey,
  tagTableName,
  optionsListe,
  userCreatedOptionsIds,
  disabledOptionsIds,
  refetchOptions,
  onTagEdit,
  ...props
}: SelectTagsProps) => {
  const collectiviteId = useCollectiviteId();

  // Liste d'options pour le select
  const options: Option[] = (optionsListe ?? []).map((opt) => ({
    value: opt.id,
    label: opt.nom,
    disabled: disabledOptionsIds?.includes(opt.id),
  }));

  // Ids des options pour le createProps
  const optionsIds = (optionsListe ?? []).map((opt) => opt.id);

  // Formattage des valeurs sélectionnées pour les renvoyer au composant parent
  const getSelectedValues = (values?: OptionValue[]) =>
    (optionsListe ?? []).filter((opt) => values?.some((v) => v === opt.id));

  // ***
  // Ajout d'un nouveau tag à la liste d'options
  // ***

  const { data: newTag, mutate: createTag } = useTagCreate({
    key: [queryKey, collectiviteId],
    tagTableName,
    onSuccess: refetchOptions,
  });

  const newTagId = newTag?.data?.[0].id;

  const handleTagCreate = (tagName: string) => {
    createTag({
      collectiviteId: collectiviteId!,
      nom: tagName,
    });
  };

  useEffect(() => {
    // Sélectionne le nouveau tag une fois la création terminée
    if (newTag?.data) {
      const tag = {
        collectiviteId: collectiviteId!,
        nom: newTag.data[0].nom,
        id: newTag.data[0].id,
      };

      props.onChange({
        values: [tag, ...getSelectedValues(props.values)],
        selectedValue: tag,
      });
    }
  }, [newTagId]);

  // ***
  // Mise à jour d'un tag de la liste d'options
  // ***

  const { mutate: updateTag } = useTagUpdate({
    key: [queryKey, collectiviteId],
    tagTableName,
    onSuccess: refetchOptions,
  });

  const handleTagUpdate = (tagId: OptionValue, tagName: string) => {
    const editedTag = {
      collectiviteId: collectiviteId!,
      id: parseInt(tagId as string),
      nom: tagName,
    };

    updateTag(editedTag);
    onTagEdit?.(editedTag);
  };

  // ***
  // Suppression d'un tag de la liste d'options
  // ***

  const { mutate: deleteTag } = useDeleteTag({
    key: [queryKey, collectiviteId],
    tagTableName,
    onSuccess: refetchOptions,
  });

  const handleTagDelete = (tagId: OptionValue) => {
    props.onChange({
      values: getSelectedValues(props.values?.filter((v) => v !== tagId)),
      selectedValue: getSelectedValues(
        props.values?.filter((v) => v === tagId)
      )[0],
    });
    deleteTag(parseInt(tagId as string));
  };

  return (
    <SelectFilter
      {...props}
      options={options}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          values: getSelectedValues(values),
          selectedValue: getSelectedValues([selectedValue])[0],
        })
      }
      createProps={{
        userCreatedOptions: userCreatedOptionsIds ?? optionsIds,
        onCreate: handleTagCreate,
        onUpdate: handleTagUpdate,
        onDelete: handleTagDelete,
      }}
    />
  );
};

export default SelectTags;
