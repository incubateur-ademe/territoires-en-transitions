import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {useStructurePiloteListe} from '../data/options/useStructurePiloteListe';
import {TFicheActionStructureInsert} from 'types/alias';
import {formatNewTag} from '../data/utils';
import {useDeleteTag} from 'ui/DropdownLists/hooks/useTagDelete';
import {useTagUpdate} from 'ui/DropdownLists/hooks/useTagUpdate';

type Props = {
  structures: TFicheActionStructureInsert[] | null;
  onSelect: (structures: TFicheActionStructureInsert[]) => void;
  isReadonly: boolean;
};

const StructurePiloteDropdown = ({structures, onSelect, isReadonly}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: structureListe} = useStructurePiloteListe();

  const {mutate: updateTag} = useTagUpdate({
    key: ['structures', collectivite_id],
    tagTableName: 'structure_tag',
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['structures', collectivite_id],
    tagTableName: 'structure_tag',
  });

  const options: TOption[] = structureListe
    ? structureListe.map(structure => ({
        value: structure.id.toString(),
        label: structure.nom,
      }))
    : [];

  const formatStructures = (values: string[]) =>
    structureListe?.filter(structure =>
      values.some(v => v === structure.id?.toString())
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction

  return (
    <SelectCreateTagsDropdown
      values={structures?.map((s: TFicheActionStructureInsert) =>
        s.id ? s.id.toString() : ''
      )}
      options={options}
      onSelect={values => onSelect(formatStructures(values))}
      onCreateClick={inputValue =>
        onSelect(
          structures
            ? [...structures, formatNewTag(inputValue, collectivite_id!)]
            : [formatNewTag(inputValue, collectivite_id!)]
        )
      }
      onUpdateTagName={(tag_id, tag_name) =>
        updateTag({
          collectivite_id: collectivite_id!,
          id: parseInt(tag_id),
          nom: tag_name,
        })
      }
      onDeleteClick={tag_id => deleteTag(parseInt(tag_id))}
      userCreatedTagIds={structureListe?.map(s => s.id.toString())}
      disabled={isReadonly}
    />
  );
};

export default StructurePiloteDropdown;
