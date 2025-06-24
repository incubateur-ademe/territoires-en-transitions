import BadgeStatut from '@/app/app/pages/collectivite/PlansActions/components/BadgeStatut';
import {
  filterLabels,
  StatutOrNot,
} from '@/app/plans/plans/detailed-plan-action-view/data/useFichesActionFiltresListe/types';
import { ficheActionStatutOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { TOption } from '@/app/ui/shared/select/commons';
import { SANS_STATUT_LABEL, Statut } from '@/domain/plans/fiches';
import { Field, SelectFilter } from '@/ui';

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
