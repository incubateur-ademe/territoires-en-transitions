import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { TOption } from '@/app/ui/shared/select/commons';
import { SANS_STATUT_LABEL, Statut } from '@/domain/plans/fiches';
import { Field, SelectFilter } from '@/ui';
import { StatutOrNot } from '../../data/use-fiches-filters-list/types';

const options: TOption[] = [
  { value: SANS_STATUT_LABEL, label: SANS_STATUT_LABEL },
  ...ficheActionStatutOptions,
];

export const StatutsDropdown = ({
  values,
  onChange,
  title,
}: {
  values: StatutOrNot[];
  onChange: (status: StatutOrNot[]) => void;
  title: string;
}) => {
  return (
    <Field title={title}>
      <SelectFilter
        dataTest="filtre-statut"
        values={values}
        options={options}
        onChange={({ values }) => onChange(values as StatutOrNot[])}
        disabled={options.length === 0}
        customItem={(item) =>
          item.value === SANS_STATUT_LABEL ? (
            <span>Sans statut</span>
          ) : (
            <BadgeStatut statut={item.value as Statut} />
          )
        }
      />
    </Field>
  );
};
