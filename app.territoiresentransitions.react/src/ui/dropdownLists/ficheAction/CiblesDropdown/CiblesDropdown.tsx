import { TFicheActionCibles } from '@/app/types/alias';
import { SelectFilter, SelectMultipleProps } from '@/ui';
import { ficheActionCiblesOptions } from '../../listesStatiques';

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
      onChange={({ values, selectedValue }) =>
        props.onChange({
          cibles: values as TFicheActionCibles[],
          selectedCible: selectedValue as TFicheActionCibles,
        })
      }
    />
  );
};

export default CiblesDropdown;
