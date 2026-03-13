import { SHARE_ICON } from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { TagType, TagWithCollectiviteId } from '@tet/domain/collectivites';
import {
  Option,
  OptionValue,
  SelectFilter,
  SelectMultipleProps,
} from '@tet/ui';
import { useCreateTag } from './use-create-tag';
import { useDeleteTag } from './use-delete-tag';
import { useUpdateTag } from './use-update-tag';

export type SelectTagsComboboxProps = Omit<
  SelectMultipleProps,
  'options' | 'onChange' | 'placeholder'
> & {
  values?: number[];
  tagType: TagType;
  optionsListe?: TagWithCollectiviteId[];
  userCreatedOptionsIds?: number[];
  disabledOptionsIds?: number[];
  refetchOptions: () => void;
  onChange: ({
    values,
    selectedValue,
  }: {
    values: TagWithCollectiviteId[];
    selectedValue: TagWithCollectiviteId;
  }) => void;
  optionsAreCaseSensitive?: boolean;
  placeholder?: string | ((isEditionEnabled: boolean) => string);
  disableEdition?: boolean;
};

export const SelectTagsCombobox = ({
  tagType,
  optionsListe,
  userCreatedOptionsIds,
  disabledOptionsIds,
  refetchOptions,
  optionsAreCaseSensitive = true,
  placeholder,
  disableEdition = false,
  ...props
}: SelectTagsComboboxProps) => {
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite.collectiviteId;
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
    disabled: disabledOptionsIds?.includes(opt.id),
  }));

  // Ids des options pour le createProps
  const editableOptionsIds = (optionsListe ?? [])
    .filter((opt) => opt.collectiviteId === collectiviteId)
    .map((opt) => opt.id);

  // Formattage des valeurs sélectionnées pour les renvoyer au composant parent
  const getSelectedValues = (values?: OptionValue[]) =>
    (optionsListe ?? []).filter((opt) => values?.some((v) => v === opt.id));

  const isEditionEnabled =
    !disableEdition &&
    collectivite.hasCollectivitePermission('collectivites.tags.mutate');

  // ***
  // Ajout d'un nouveau tag à la liste d'options
  // ***

  const { mutate: createTag } = useCreateTag({
    tagType,
    onSuccess: refetchOptions,
  });

  const handleTagCreate = (tagName: string) => {
    createTag(
      {
        nom: tagName,
      },
      {
        onSuccess: (tag) => {
          props.onChange({
            values: [tag, ...getSelectedValues(props.values)],
            selectedValue: tag,
          });
        },
      }
    );
  };

  // ***
  // Mise à jour d'un tag de la liste d'options
  // ***

  const { mutate: updateTag } = useUpdateTag({
    tagType,
    onSuccess: refetchOptions,
  });

  const handleTagUpdate = (tagId: OptionValue, tagName: string) => {
    updateTag({
      id: parseInt(tagId as string),
      nom: tagName,
    });
  };

  // ***
  // Suppression d'un tag de la liste d'options
  // ***

  const { mutate: deleteTag } = useDeleteTag({
    tagType,
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

  const computedPlaceholder =
    typeof placeholder === 'string'
      ? placeholder
      : placeholder?.(isEditionEnabled);

  return (
    <SelectFilter
      {...props}
      placeholder={computedPlaceholder}
      options={options}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          values: getSelectedValues(values),
          selectedValue: getSelectedValues([selectedValue])[0],
        })
      }
      createProps={
        isEditionEnabled
          ? {
              userCreatedOptions: userCreatedOptionsIds ?? editableOptionsIds,
              onCreate: handleTagCreate,
              onUpdate: handleTagUpdate,
              onDelete: handleTagDelete,
            }
          : undefined
      }
      optionsAreCaseSensitive={optionsAreCaseSensitive}
    />
  );
};
