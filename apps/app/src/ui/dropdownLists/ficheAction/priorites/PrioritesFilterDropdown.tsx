import { PrioriteOrNot } from '@/app/plans/fiches/list-all-fiches/filters/types';
import FichePrioriteBadge from '@/app/plans/fiches/show-fiche/components/fiche-priorite.badge';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Priorite, SANS_PRIORITE_LABEL } from '@tet/domain/plans';
import { Option, SelectFilter, SelectMultipleProps } from '@tet/ui';

const options: Option[] = [
  { value: SANS_PRIORITE_LABEL, label: SANS_PRIORITE_LABEL },
  ...ficheActionNiveauPrioriteOptions,
];

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: PrioriteOrNot[];
  onChange: (priorites: PrioriteOrNot[]) => void;
};

const PrioritesFilterDropdown = (props: Props) => {
  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'filtre-priorite'}
      options={options}
      onChange={({ values }) => props.onChange(values as PrioriteOrNot[])}
      custom={{
        renderOptionItem: (item) =>
          item.value === SANS_PRIORITE_LABEL ? (
            <span>Non priorisé</span>
          ) : (
            <FichePrioriteBadge priorite={item.value as Priorite} />
          ),
      }}
    />
  );
};

export default PrioritesFilterDropdown;
