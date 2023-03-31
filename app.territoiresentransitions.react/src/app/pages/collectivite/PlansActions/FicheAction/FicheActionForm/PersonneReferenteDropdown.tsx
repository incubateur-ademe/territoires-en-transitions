import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {usePersonneReferenteListe} from '../data/options/usePersonneReferenteListe';
import {Personne} from '../data/types';
import {formatNewTag, getPersonneId} from '../data/utils';

type Props = {
  personnes: Personne[] | null;
  onSelect: (personnes: Personne[]) => void;
  isReadonly: boolean;
};

const PersonneReferenteDropdown = ({
  personnes,
  onSelect,
  isReadonly,
}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: personneListe} = usePersonneReferenteListe();

  const options: TOption[] = personneListe
    ? personneListe.map(personne => ({
        value: getPersonneId(personne),
        label: personne.nom!,
      }))
    : [];

  const formatPersonneReferente = (values: string[]) =>
    personneListe?.filter(personne =>
      values.some(v => v === getPersonneId(personne))
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction

  return (
    <SelectCreateTagsDropdown
      values={personnes?.map(personne => getPersonneId(personne))}
      options={options}
      onSelect={values => onSelect(formatPersonneReferente(values))}
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

export default PersonneReferenteDropdown;
