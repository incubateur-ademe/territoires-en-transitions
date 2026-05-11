import FichePrioriteBadge from '@/app/plans/fiches/show-fiche/components/fiche-priorite.badge';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { Priorite } from '@tet/domain/plans';
import { SelectFilter, SelectMultipleProps } from '@tet/ui';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: Priorite[];
  onChange: ({
    priorites,
    selectedPriorites,
  }: {
    priorites: Priorite[] | undefined;
    selectedPriorites: Priorite;
  }) => void;
};

const PrioritesFilterDropdown = (props: Props) => {
  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'priorites'}
      options={ficheActionNiveauPrioriteOptions}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          priorites: values as Priorite[] | undefined,
          selectedPriorites: selectedValue as Priorite,
        })
      }
      customItem={(item) => (
        <FichePrioriteBadge priorite={item.value as Priorite} />
      )}
    />
  );
};

export default PrioritesFilterDropdown;
