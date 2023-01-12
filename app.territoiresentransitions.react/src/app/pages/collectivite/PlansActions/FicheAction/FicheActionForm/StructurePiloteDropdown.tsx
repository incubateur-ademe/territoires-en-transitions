import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {useStructurePiloteListe} from '../data/options/useStructurePiloteListe';
import {TFicheActionStructureInsert} from '../data/types/alias';

type Props = {
  structures: TFicheActionStructureInsert[] | null;
  onSelect: (structures: TFicheActionStructureInsert[]) => void;
};

const StructurePiloteDropdown = ({structures, onSelect}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: structureListe} = useStructurePiloteListe();

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

  const formatNewStructure = (inputValue: string) => ({
    collectivite_id: collectivite_id!,
    nom: inputValue,
  });

  // On invalide la liste des options dans useEditFicheAction

  return (
    <SelectCreateTagsDropdown
      values={structures?.map((s: TFicheActionStructureInsert) =>
        s.id!.toString()
      )}
      options={options}
      onSelect={values => onSelect(formatStructures(values))}
      onCreateClick={inputValue =>
        onSelect(
          structures
            ? [...structures, formatNewStructure(inputValue)]
            : [formatNewStructure(inputValue)]
        )
      }
      placeholderText="Créer un tag..."
    />
  );
};

export default StructurePiloteDropdown;
