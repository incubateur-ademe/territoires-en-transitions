import { SelectTagsGeneric } from '@/app/ui/dropdownLists/tags';
import { InstanceGouvernance } from '@tet/domain/collectivites';
import { useCreateInstanceGouvernanceTag } from '../../show-fiche/data/use-create-instance-gouvernance-tag';
import { useDeleteInstanceGouvernance } from '../../show-fiche/data/use-delete-instance-gouvernance-tag';
import { useListInstanceGouvernanceTags } from '../../show-fiche/data/use-list-instance-gouvernance-tags';
import { useUpdateInstanceGouvernanceTag } from '../../show-fiche/data/use-update-instance-gouvernance-tag';

type LightInstanceGouvernance = Omit<
  InstanceGouvernance,
  'createdAt' | 'createdBy'
>;

type GenericProps = {
  collectiviteId: number;
  values?: number[] | null;
  onChange: (tags: LightInstanceGouvernance[]) => void;
};
type Props = GenericProps &
  (
    | { canEditTags?: true; ficheId: number }
    | { canEditTags: false; ficheId?: null }
  );
export const InstanceGouvernanceDropdown = ({
  canEditTags = true,
  collectiviteId,
  values,
  onChange,
  ficheId,
}: Props) => {
  const { instanceGouvernanceTags } =
    useListInstanceGouvernanceTags(collectiviteId);
  const { mutate: createInstanceGouvernanceTag } =
    useCreateInstanceGouvernanceTag(collectiviteId, ficheId ?? undefined);
  const { mutate: updateInstanceGouvernanceTag } =
    useUpdateInstanceGouvernanceTag(collectiviteId);
  const { mutate: deleteInstanceGouvernance } =
    useDeleteInstanceGouvernance(collectiviteId);

  const selectedTags = (values ?? [])
    .map((id) => instanceGouvernanceTags.find((tag) => tag.id === id))
    .filter((tag): tag is InstanceGouvernance => tag !== undefined);

  return (
    <SelectTagsGeneric
      tags={instanceGouvernanceTags}
      values={selectedTags}
      onChange={(tags) => onChange(tags)}
      canEditTags={canEditTags}
      onDelete={({ id }) =>
        deleteInstanceGouvernance({
          id,
          collectiviteId,
        })
      }
      onCreate={
        ficheId
          ? async (tag) => {
              const result = await createInstanceGouvernanceTag(tag);
              return result;
            }
          : undefined
      }
      onUpdate={async (tag) => {
        const result = await updateInstanceGouvernanceTag({
          id: tag.id,
          collectiviteId,
          nom: tag.nom,
        });
        return result;
      }}
    />
  );
};
