import {SelectFilter, SelectMultipleProps} from '@tet/ui';
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
  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={ficheActionCiblesOptions}
      placeholder={props.placeholder ?? 'Sélectionnez une ou plusieurs cibles'}
      onChange={({values, selectedValue}) =>
        props.onChange({
          cibles: values as TFicheActionCibles[],
          selectedCible: selectedValue as TFicheActionCibles,
        })
      }
    />
  );
};

export default CiblesDropdown;
