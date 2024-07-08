import {OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';
import {ficheActionCiblesOptions} from 'app/pages/collectivite/PlansActions/FicheAction/data/options/listesStatiques';
import {TFicheActionCibles} from 'types/alias';

type CiblesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: TFicheActionCibles[];
  onChange: ({
    cibles,
    selectedCible,
  }: {
    cibles: TFicheActionCibles[];
    selectedCible: TFicheActionCibles;
  }) => void;
};

const CiblesDropdown = (props: CiblesDropdownProps) => {
  const getSelectedCibles = (values?: OptionValue[]) =>
    ficheActionCiblesOptions.filter(c => values?.some(v => v === c.value));

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest}
      isSearcheable
      options={ficheActionCiblesOptions}
      placeholder={props.placeholder ?? 'Sélectionnez une ou plusieurs cibles'}
      onChange={({values, selectedValue}) =>
        props.onChange({
          cibles: getSelectedCibles(values).map(
            c => c.label as TFicheActionCibles
          ),
          selectedCible: getSelectedCibles([selectedValue])[0]
            .label as TFicheActionCibles,
        })
      }
    />
  );
};

export default CiblesDropdown;
