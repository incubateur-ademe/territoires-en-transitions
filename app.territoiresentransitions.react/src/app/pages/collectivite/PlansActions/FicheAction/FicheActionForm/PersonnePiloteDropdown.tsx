import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {usePersonnePiloteListe} from '../data/options/usePersonnePiloteListe';
import {Personne} from '../data/types/personne';
import {formatNewTag, getPersonneId} from '../data/utils';

type Props = {
  personnes: Personne[] | null;
  onSelect: (personnes: Personne[]) => void;
  isReadonly: boolean;
};

const PersonnePiloteDropdown = ({personnes, onSelect, isReadonly}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: personneListe} = usePersonnePiloteListe();

  const options: TOption[] = personneListe
    ? personneListe.map(personne => ({
        value: getPersonneId(personne),
        label: personne.nom!,
      }))
    : [];

  const formatPersonnePilote = (values: string[]) =>
    personneListe?.filter(personne =>
      values.some(v => v === getPersonneId(personne))
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction

  return (
    <SelectCreateTagsDropdown
      values={personnes?.map((personne: Personne) => getPersonneId(personne))}
      options={options}
      onSelect={values => onSelect(formatPersonnePilote(values))}
      onCreateClick={inputValue =>
        onSelect(
          personnes
            ? [...personnes, formatNewTag(inputValue, collectivite_id!)]
            : [formatNewTag(inputValue, collectivite_id!)]
        )
      }
      placeholderText="Créer un tag..."
      disabled={isReadonly}
    />
  );
};

export default PersonnePiloteDropdown;
