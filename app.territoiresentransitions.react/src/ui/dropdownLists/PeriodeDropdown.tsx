import { Select, SelectMultipleProps } from '@tet/ui';
import { ficheActionModifiedSinceOptions } from 'ui/dropdownLists/listesStatiques';
import { ModifiedSince } from '@tet/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';

type PeriodeDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: ModifiedSince;
  onChange: (periode: ModifiedSince) => void;
};

const PeriodeDropdown = (props: PeriodeDropdownProps) => {
  return (
    <Select
      {...props}
      options={ficheActionModifiedSinceOptions}
      placeholder={props.placeholder ?? 'Sélectionnez une période'}
      onChange={(value) => props.onChange(value as ModifiedSince)}
    />
  );
};

export default PeriodeDropdown;
