import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {usePartenaireListe} from '../data/options/usePartenaireListe';
import {TPartenaireInsert} from '../data/types/alias';
import {formatNewTag} from '../data/utils';

type Props = {
  partenaires: TPartenaireInsert[] | null;
  onSelect: (partenaires: TPartenaireInsert[]) => void;
  isReadonly: boolean;
};

const PartenairesDropdown = ({partenaires, onSelect, isReadonly}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: partenaireListe} = usePartenaireListe();

  const options: TOption[] = partenaireListe
    ? partenaireListe.map(partenaire => ({
        value: partenaire.id.toString(),
        label: partenaire.nom,
      }))
    : [];

  const formatPartenaires = (values: string[]) =>
    partenaireListe?.filter(partenaire =>
      values.some(v => v === partenaire.id?.toString())
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction

  return (
    <SelectCreateTagsDropdown
      values={partenaires?.map((s: TPartenaireInsert) => s.id!.toString())}
      options={options}
      onSelect={values => onSelect(formatPartenaires(values))}
      onCreateClick={inputValue =>
        onSelect(
          partenaires
            ? [...partenaires, formatNewTag(inputValue, collectivite_id!)]
            : [formatNewTag(inputValue, collectivite_id!)]
        )
      }
      placeholderText="Créer un tag..."
      disabled={isReadonly}
    />
  );
};

export default PartenairesDropdown;
