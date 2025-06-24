import BadgePriorite from '@/app/app/pages/collectivite/PlansActions/components/BadgePriorite';
import {
  filterLabels,
  PrioriteOrNot,
} from '@/app/plans/plans/detailed-plan-action-view/data/useFichesActionFiltresListe/types';
import { ficheActionNiveauPrioriteOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { TOption } from '@/app/ui/shared/select/commons';
import { Priorite, SANS_PRIORITE_LABEL } from '@/domain/plans/fiches';
import { Field, SelectFilter } from '@/ui';

const options: TOption[] = [
  { value: SANS_PRIORITE_LABEL, label: SANS_PRIORITE_LABEL },
  ...ficheActionNiveauPrioriteOptions,
];

const FiltrePriorites = ({
  values,
  onChange,
}: {
  values: PrioriteOrNot[];
  onChange: (values: PrioriteOrNot[]) => void;
}) => {
  return (
    <Field title={filterLabels.priorites}>
      <SelectFilter
        dataTest="filtre-priorite"
        values={values}
        options={options}
        onChange={({ values }) => onChange(values as PrioriteOrNot[])}
        customItem={(item) =>
          item.value === SANS_PRIORITE_LABEL ? (
            <span>Non priorisé</span>
          ) : (
            <BadgePriorite priorite={item.value as Priorite} />
          )
        }
        disabled={options.length === 0}
      />
    </Field>
  );
};

export default FiltrePriorites;
