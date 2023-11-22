import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {useThematiqueListe} from '../../PlansActions/FicheAction/data/options/useThematiqueListe';

type Props = {
  values: string[] | undefined;
  onSelect: (thematique_ids: string[]) => void;
};

const FiltreThematiques = ({values, onSelect}: Props) => {
  const {data: thematiqueListe} = useThematiqueListe();

  const options: TOption[] = thematiqueListe
    ? [
        {value: ITEM_ALL, label: 'Toutes les thématiques'},
        ...thematiqueListe.map(thematique => ({
          value: `${thematique.id}`,
          label: thematique.nom,
        })),
      ]
    : [];

  return (
    <AutocompleteInputSelect
      data-test="thematiques"
      buttonClassName={DSFRbuttonClassname}
      values={values?.includes(ITEM_ALL) ? [] : values}
      options={options}
      onSelect={values => onSelect(values)}
    />
  );
};

export default FiltreThematiques;
