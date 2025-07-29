import { TableTag } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { SHARE_ICON } from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { Tag } from '@/domain/collectivites';
import { Option, OptionValue, SelectFilter, SelectMultipleProps } from '@/ui';
import { useEffect } from 'react';
import { QueryKey } from 'react-query';
import { useDeleteTag, useTagCreate, useTagUpdate } from '.';

type SelectTagsProps = Omit<SelectMultipleProps, 'options' | 'onChange'> & {
  queryKey: QueryKey;
  additionalKeysToInvalidate?: QueryKey[];
  tagTableName: TableTag;
  optionsListe?: Tag[];
  userCreatedOptionsIds?: number[];
  disableOptionsForOtherCollectivites?: boolean;
  disabledOptionsIds?: number[];
  refetchOptions: () => void;
  onChange: ({
    values,
    selectedValue,
  }: {
    values: Tag[];
    selectedValue: Tag;
  }) => void;
};

const SelectTags = ({
  queryKey,
  additionalKeysToInvalidate,
  tagTableName,
  optionsListe,
  userCreatedOptionsIds,
  disableOptionsForOtherCollectivites,
  disabledOptionsIds,
  refetchOptions,
  ...props
}: SelectTagsProps) => {
  const collectiviteId = useCollectiviteId();

  // Liste d'options pour le select
  const options: Option[] = (optionsListe ?? []).map((opt) => ({
    value: opt.id,
    label: opt.nom,
    icon:
      opt.collectiviteId && opt.collectiviteId !== collectiviteId
        ? SHARE_ICON
        : undefined,
    iconClassname:
      opt.collectiviteId && opt.collectiviteId !== collectiviteId
        ? 'text-success-1'
        : undefined,
    disabled:
      disabledOptionsIds?.includes(opt.id) ||
      (disableOptionsForOtherCollectivites &&
        opt.collectiviteId !== collectiviteId),
  }));

  // Ids des options pour le createProps
  const editableOptionsIds = (optionsListe ?? [])
    .filter((opt) => opt.collectiviteId === collectiviteId)
    .map((opt) => opt.id);

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
      collectiviteId,
      nom: tagName,
    });
  };

  useEffect(() => {
    // Sélectionne le nouveau tag une fois la création terminée
    if (newTag?.data) {
      const tag = {
        collectiviteId,
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
    keysToInvalidate: additionalKeysToInvalidate,
    onSuccess: refetchOptions,
  });

  const handleTagUpdate = (tagId: OptionValue, tagName: string) => {
    updateTag({
      collectiviteId,
      id: parseInt(tagId as string),
      nom: tagName,
    });
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
        userCreatedOptions: userCreatedOptionsIds ?? editableOptionsIds,
        onCreate: handleTagCreate,
        onUpdate: handleTagUpdate,
        onDelete: handleTagDelete,
      }}
    />
  );
};

export default SelectTags;
