import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';

type Props = {
  values: string[] | undefined;
  onSelect: (values: string[]) => void;
};

const options: TOption[] = [
  {value: ITEM_ALL, label: 'Tous'},
  {value: 'oui', label: 'Complété'},
  {value: 'non', label: 'À compléter'},
];

const FiltreComplet = ({values, onSelect}: Props) => {
  return (
    <AutocompleteInputSelect
      data-test="complet"
      buttonClassName={DSFRbuttonClassname}
      values={values?.includes(ITEM_ALL) ? [] : values}
      options={options}
      onSelect={values => onSelect(values)}
    />
  );
};

export default FiltreComplet;
