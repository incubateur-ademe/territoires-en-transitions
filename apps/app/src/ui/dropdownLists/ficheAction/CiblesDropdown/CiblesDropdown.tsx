import { appLabels } from '@/app/labels/catalog';
import { Cible } from '@tet/domain/plans';
import { SelectFilter, SelectMultipleProps } from '@tet/ui';
import { ficheActionCiblesOptions } from '../../listesStatiques';

type CiblesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: Cible[];
  onChange: ({
    cibles,
    selectedCible,
  }: {
    cibles: Cible[];
    selectedCible: Cible;
  }) => void;
};

const CiblesDropdown = (props: CiblesDropdownProps) => {
  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={ficheActionCiblesOptions}
      placeholder={props.placeholder ?? appLabels.placeholderSelectionnezCibles}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          cibles: values ? (values as Cible[]) : [],
          selectedCible: selectedValue as Cible,
        })
      }
    />
  );
};

export default CiblesDropdown;
