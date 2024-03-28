import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {usePersonneListe} from '../../PlansActions/FicheAction/data/options/usePersonneListe';

type Props = {
  values: string[] | undefined;
  onSelect: (values: string[]) => void;
};

const FiltrePersonnes = ({values, onSelect}: Props) => {
  const {data: personneListe} = usePersonneListe();

  const options: TOption[] = personneListe
    ? [
        {value: ITEM_ALL, label: 'Tous'},
        ...personneListe.map(personne => ({
          value: `${personne.user_id || personne.tag_id}`,
          label: personne.nom || '',
        })),
      ]
    : [];

  return (
    <AutocompleteInputSelect
      data-test="personnes"
      buttonClassName={DSFRbuttonClassname}
      values={values?.includes(ITEM_ALL) ? [] : values}
      options={options}
      onSelect={values => onSelect(values)}
    />
  );
};

export default FiltrePersonnes;
