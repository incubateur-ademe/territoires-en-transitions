import { appLabels } from '@/app/labels/catalog';
import {
  canCustomizeIndicateurPeriodicite,
  type IndicateurPeriodicite,
  type IndicateurPeriodiciteMode,
} from '@tet/domain/indicateurs';
import { Field, Select } from '@tet/ui';
import { getIndicateurPeriodPresentation } from './indicateur-period-presentation';

type Props = {
  mode: IndicateurPeriodiciteMode;
  periodiciteParDefaut: IndicateurPeriodicite;
  periodicitePersonnalisee: IndicateurPeriodicite | null;
  options: { value: IndicateurPeriodicite; label: string }[];
  disabled?: boolean;
  onChange: (periodicite: IndicateurPeriodicite | null) => void;
};

export const IndicateurPeriodiciteSelect = ({
  mode,
  periodiciteParDefaut,
  periodicitePersonnalisee,
  options,
  disabled,
  onChange,
}: Props) => {
  const customizable = canCustomizeIndicateurPeriodicite(mode);
  const defaultLabel =
    getIndicateurPeriodPresentation(periodiciteParDefaut).label;
  const choices = [
    {
      value: 'default',
      label: customizable
        ? appLabels.periodiciteRecommandee(defaultLabel)
        : defaultLabel,
    },
    ...options,
  ];
  if (
    periodicitePersonnalisee &&
    !options.some(({ value }) => value === periodicitePersonnalisee)
  ) {
    choices.push({
      value: periodicitePersonnalisee,
      label: getIndicateurPeriodPresentation(periodicitePersonnalisee).label,
    });
  }

  return (
    <Field
      title={appLabels.periodiciteDeclarationCollectivite}
      hint={
        customizable
          ? appLabels.periodiciteHistoriqueConserve
          : appLabels.periodiciteImposee
      }
      className="max-w-96"
      small
    >
      <Select
        dataTest="indicateurs.periodicite.select"
        values={
          customizable ? periodicitePersonnalisee ?? 'default' : 'default'
        }
        options={choices}
        disabled={disabled || !customizable}
        onChange={(value) => {
          if (!customizable || disabled) return;
          if (value === 'default') onChange(null);
          else {
            const option = options.find(
              (candidate) => candidate.value === value
            );
            if (option) onChange(option.value);
          }
        }}
      />
    </Field>
  );
};
