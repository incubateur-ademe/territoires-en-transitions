import { SHARE_ICON } from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import {
  Option,
  OptionValue,
  SelectFilter,
  SelectMultipleProps,
} from '@tet/ui';

type SelectTagsGenericProps = Omit<
  SelectMultipleProps,
  'options' | 'onChange' | 'placeholder' | 'values'
> & {
  values: TagWithCollectiviteId[] | null | undefined;
  tags: TagWithCollectiviteId[];
  placeholder?: string | ((isEditionAllowed: boolean) => string);
  onCreate?: (
    params: Omit<TagWithCollectiviteId, 'id'>
  ) => Promise<TagWithCollectiviteId>;
  onUpdate?: (params: TagWithCollectiviteId) => Promise<TagWithCollectiviteId>;
  onDelete?: (args: { id: number }) => void;
  onCreateSuccess?: (newItem: TagWithCollectiviteId) => void;
  onChange: (selectedTags: TagWithCollectiviteId[]) => void;
  canEditTags?: boolean;
};

export const SelectTagsGeneric = ({
  tags,
  values,
  placeholder,
  onCreate,
  onUpdate,
  onDelete,
  onCreateSuccess,
  canEditTags = true,
  ...props
}: SelectTagsGenericProps) => {
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite.collectiviteId;
  const options: Option[] = tags.map((tag) => ({
    value: tag.id,
    label: tag.nom,
    icon:
      tag.collectiviteId && tag.collectiviteId !== collectiviteId
        ? SHARE_ICON
        : undefined,
    iconClassname:
      tag.collectiviteId && tag.collectiviteId !== collectiviteId
        ? 'text-success-1'
        : undefined,
  }));

  const isEditionAllowed =
    collectivite.hasCollectivitePermission('collectivites.mutate') &&
    (onCreate !== undefined ||
      onUpdate !== undefined ||
      onDelete !== undefined) &&
    canEditTags !== false;

  const computedPlaceholder =
    typeof placeholder === 'string'
      ? placeholder
      : placeholder?.(isEditionAllowed);

  const onCreateTag = async (tagName: string) => {
    const newTag = await onCreate?.({
      nom: tagName,
      collectiviteId: collectiviteId,
    });
    if (newTag) {
      props.onChange([...(values ?? []), newTag]);
    }
  };

  const onUpdateTag = async (tagId: OptionValue, tagName: string) => {
    const updatedTag = await onUpdate?.({
      id: parseInt(tagId as string),
      nom: tagName,
      collectiviteId: collectiviteId,
    });
    if (updatedTag) {
      const updatedValues =
        values?.map((v) => (v.id === tagId ? updatedTag : v)) ?? [];
      props.onChange(updatedValues);
    }
  };

  const onDeleteTag = async (tagId: OptionValue) => {
    await onDelete?.({ id: parseInt(tagId as string) });
    props.onChange(values?.filter((v) => v.id !== tagId) ?? []);
  };

  return (
    <SelectFilter
      {...props}
      placeholder={computedPlaceholder}
      options={options}
      values={values?.map((v) => v.id) ?? []}
      onChange={({ values: selectedValues }) =>
        props.onChange(
          selectedValues
            ?.map((v) => tags.find((o) => o.id === v))
            .filter((v) => v !== undefined) ?? []
        )
      }
      createProps={
        isEditionAllowed
          ? {
              userCreatedOptions: tags.map((t) => t.id),
              onCreate: onCreateTag,
              onUpdate: onUpdateTag,
              onDelete: onDeleteTag,
            }
          : undefined
      }
    />
  );
};
