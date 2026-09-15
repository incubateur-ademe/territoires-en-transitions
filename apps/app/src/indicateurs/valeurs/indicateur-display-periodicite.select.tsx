import { appLabels } from '@/app/labels/catalog';
import {
  type IndicateurPeriodicite,
  listIndicateurDisplayPeriodicites,
  resolveIndicateurDisplayPeriodicite,
} from '@tet/domain/indicateurs';
import { Field, Select } from '@tet/ui';
import { getIndicateurPeriodPresentation } from './indicateur-period-presentation';

type Props = {
  periodicite: IndicateurPeriodicite;
  periodiciteAffichage?: IndicateurPeriodicite;
  onChange: (periodicite: IndicateurPeriodicite) => void;
};

export const IndicateurDisplayPeriodiciteSelect = ({
  periodicite,
  periodiciteAffichage,
  onChange,
}: Props) => {
  const options = listIndicateurDisplayPeriodicites(periodicite).map(
    (value) => ({
      value,
      label: getIndicateurPeriodPresentation(value).label,
    })
  );

  return (
    <Field
      title={appLabels.periodiciteAffichageGraphique}
      hint={appLabels.periodiciteAffichageGraphiqueHint}
      className="max-w-96"
      small
    >
      <Select
        dataTest="indicateurs.chart.periodicite-affichage.select"
        values={resolveIndicateurDisplayPeriodicite(
          periodicite,
          periodiciteAffichage
        )}
        options={options}
        disabled={options.length === 1}
        onChange={(value) => {
          const option = options.find((candidate) => candidate.value === value);
          if (option) onChange(option.value);
        }}
      />
    </Field>
  );
};
