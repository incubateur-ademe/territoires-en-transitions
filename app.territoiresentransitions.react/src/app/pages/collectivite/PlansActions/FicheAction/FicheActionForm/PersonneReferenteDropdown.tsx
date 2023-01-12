import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {usePersonneReferenteListe} from '../data/options/usePersonneReferenteListe';
import {Personne} from '../data/types/personne';

type Props = {
  personnes: Personne[] | null;
  onSelect: (personnes: Personne[]) => void;
};

const PersonneReferenteDropdown = ({personnes, onSelect}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: personneListe} = usePersonneReferenteListe();

  const options: TOption[] = personneListe
    ? personneListe.map(personne => ({
        value: personne.tag_id
          ? personne.tag_id!.toString()
          : personne.user_id!,
        label: personne.nom!,
      }))
    : [];

  const formatPersonneReferente = (values: string[]) =>
    personneListe?.filter(personne =>
      values.some(
        v => v === personne.user_id || v === personne.tag_id?.toString()
      )
    ) ?? [];

  const formatNewPersonneReferente = (inputValue: string) => ({
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
      onSelect={values => onSelect(formatPersonneReferente(values))}
      onCreateClick={inputValue =>
        onSelect(
          personnes
            ? [...personnes, formatNewPersonneReferente(inputValue)]
            : [formatNewPersonneReferente(inputValue)]
        )
      }
      placeholderText="Créer un tag..."
    />
  );
};

export default PersonneReferenteDropdown;
