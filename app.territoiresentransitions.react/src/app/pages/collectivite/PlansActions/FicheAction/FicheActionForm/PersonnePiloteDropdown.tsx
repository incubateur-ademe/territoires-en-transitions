import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {usePersonnePiloteListe} from '../data/options/usePersonnePiloteListe';
import {Personne} from '../data/types/personne';

type Props = {
  personnes: Personne[] | null;
  onSelect: (personnes: Personne[]) => void;
};

const PersonnePiloteDropdown = ({personnes, onSelect}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: personneListe} = usePersonnePiloteListe();

  const options: TOption[] = personneListe
    ? personneListe.map(personne => ({
        value: personne.tag_id
          ? personne.tag_id!.toString()
          : personne.user_id!,
        label: personne.nom!,
      }))
    : [];

  const formatPersonnePilote = (values: string[]) =>
    personneListe?.filter(personne =>
      values.some(
        v => v === personne.user_id || v === personne.tag_id?.toString()
      )
    ) ?? [];

  const formatNewPersonnePilote = (inputValue: string) => ({
    collectivite_id: collectivite_id!,
    nom: inputValue,
  });

  // On invalide la liste des options dans useEditFicheAction

  return (
    <SelectCreateTagsDropdown
      values={personnes?.map((personne: Personne) =>
        personne.tag_id ? personne.tag_id!.toString() : personne.user_id!
      )}
      options={options}
      onSelect={values => onSelect(formatPersonnePilote(values))}
      onCreateClick={inputValue =>
        onSelect(
          personnes
            ? [...personnes, formatNewPersonnePilote(inputValue)]
            : [formatNewPersonnePilote(inputValue)]
        )
      }
      placeholderText="Créer un tag..."
    />
  );
};

export default PersonnePiloteDropdown;
