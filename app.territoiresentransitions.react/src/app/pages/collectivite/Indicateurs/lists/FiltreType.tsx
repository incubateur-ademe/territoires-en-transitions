import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';

type Props = {
  values: string[] | undefined;
  onSelect: (values: string[]) => void;
};

const options: TOption[] = [
  {value: ITEM_ALL, label: 'Tous'},
  {value: 'impact', label: 'Impact'},
  {value: 'resultat', label: 'Résultat'},
];

const FiltreType = ({values, onSelect}: Props) => {
  return (
    <AutocompleteInputSelect
      data-test="type"
      buttonClassName={DSFRbuttonClassname}
      values={values?.includes(ITEM_ALL) ? [] : values}
      options={options}
      onSelect={values => onSelect(values)}
    />
  );
};

export default FiltreType;
