import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  TFicheActionStructureInsert,
  TFicheActionStructureRow,
} from 'types/alias';
import {useDeleteTag} from 'ui/dropdownLists/hooks/useTagDelete';
import {useTagUpdate} from 'ui/dropdownLists/hooks/useTagUpdate';
import {useStructureListe} from './useStructureListe';
import {Option, OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';
import {useTagCreate} from '../hooks/useTagCreate';
import {useEffect} from 'react';

type StructuresDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({
    structures,
    selectedStructure,
  }: {
    structures: TFicheActionStructureRow[];
    selectedStructure: TFicheActionStructureRow;
  }) => void;
};

const StructuresDropdown = (props: StructuresDropdownProps) => {
  const collectivite_id = useCollectiviteId();

  const {data: structureListe} = useStructureListe();

  const options: Option[] = structureListe
    ? structureListe.map(structure => ({
        value: structure.id,
        label: structure.nom,
      }))
    : [];

  const getSelectedStructures = (values?: OptionValue[]) =>
    (structureListe ?? []).filter(s => values?.some(v => v === s.id));

  const {mutate: updateTag} = useTagUpdate({
    key: ['structures', collectivite_id],
    tagTableName: 'structure_tag',
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['structures', collectivite_id],
    tagTableName: 'structure_tag',
  });

  const {data: newTag, mutate: createTag} = useTagCreate({
    key: ['structures', collectivite_id],
    tagTableName: 'structure_tag',
  });

  const newTagId = newTag?.data?.[0].id!;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTag?.data) {
      const tag = {
        collectivite_id: collectivite_id!,
        nom: newTag.data[0].nom,
        id: newTagId,
      };

      props.onChange({
        structures: [tag, ...getSelectedStructures(props.values)],
        selectedStructure: tag,
      });
    }
  }, [newTagId]);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest}
      options={options}
      placeholder={props.placeholder}
      onChange={({values, selectedValue}) =>
        props.onChange({
          structures: getSelectedStructures(values),
          selectedStructure: getSelectedStructures([selectedValue])[0],
        })
      }
      createProps={{
        userCreatedOptions: structureListe?.map(s => s.id) ?? [],
        onUpdate: (tag_id, tag_name) => {
          updateTag({
            collectivite_id: collectivite_id!,
            id: parseInt(tag_id as string),
            nom: tag_name,
          });
        },
        onDelete: tag_id => {
          props.onChange({
            structures: getSelectedStructures(
              props.values?.filter(v => v !== tag_id)
            ),
            selectedStructure: getSelectedStructures(
              props.values?.filter(v => v === tag_id)
            )[0],
          });
          deleteTag(parseInt(tag_id as string));
        },
        onCreate: inputValue =>
          createTag({
            collectivite_id: collectivite_id!,
            nom: inputValue,
          }),
      }}
    />
  );
};

export default StructuresDropdown;
