import { StatutOrNot } from '@/app/plans/fiches/list-all-fiches/filters/types';
import FicheStatutBadge from '@/app/plans/fiches/show-fiche/components/fiche-statut.badge';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { TOption } from '@/app/ui/shared/select/commons';
import { SANS_STATUT_LABEL, Statut } from '@tet/domain/plans';
import { SelectFilter, SelectMultipleProps } from '@tet/ui';

const options: TOption[] = [
  { value: SANS_STATUT_LABEL, label: SANS_STATUT_LABEL },
  ...ficheActionStatutOptions,
];

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: StatutOrNot[];
  onChange: (status: StatutOrNot[]) => void;
};

const StatutsFilterDropdown = (props: Props) => {
  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'filtre-statut'}
      options={options}
      onChange={({ values }) => props.onChange(values as StatutOrNot[])}
      customItem={(item) =>
        item.value === SANS_STATUT_LABEL ? (
          <span>Sans statut</span>
        ) : (
          <FicheStatutBadge statut={item.value as Statut} />
        )
      }
    />
  );
};

export default StatutsFilterDropdown;
