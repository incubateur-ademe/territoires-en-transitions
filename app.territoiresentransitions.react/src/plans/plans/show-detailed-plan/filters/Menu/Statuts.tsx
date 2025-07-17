import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { TOption } from '@/app/ui/shared/select/commons';
import { SANS_STATUT_LABEL } from '@/backend/plans/fiches/shared/labels';
import { Statut } from '@/domain/plans/fiches';
import { Field, SelectFilter } from '@/ui';
import {
  filterLabels,
  StatutOrNot,
} from '../../data/use-fiches-filters-list/types';

const options: TOption[] = [
  { value: SANS_STATUT_LABEL, label: SANS_STATUT_LABEL },
  ...ficheActionStatutOptions,
];

export const StatutsFilter = ({
  values,
  onChange,
}: {
  values: StatutOrNot[];
  onChange: (status: StatutOrNot[]) => void;
}) => {
  return (
    <Field title={filterLabels.statuts}>
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
