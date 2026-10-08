import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriods,
  type IndicateurPeriodicite,
  type IndicateurPeriod,
} from '@tet/domain/indicateurs';
import { Button, Field, FieldMessage, Input } from '@tet/ui';
import { useId, useState } from 'react';

export const AddIndicateurPeriodeHeader = ({
  periodicite,
  existingPeriods,
  onAdd,
  onOpenModal,
}: {
  periodicite: IndicateurPeriodicite;
  existingPeriods: IndicateurPeriod[];
  onAdd: (periods: IndicateurPeriod[]) => Promise<boolean>;
  onOpenModal: () => void;
}) => {
  const id = useId();
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const { editor } = getIndicateurPeriodPresentation(periodicite);
  const label = editor.addLabel;
  if (editor.subdivisionOptions.length > 0)
    return (
      <Button
        size="sm"
        variant="outlined"
        onClick={onOpenModal}
        data-test="indicateurs.periodes.add"
      >
        {label}
      </Button>
    );
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        let period: IndicateurPeriod;
        try {
          period = IndicateurPeriods.parse('annuelle', year);
        } catch {
          setError(appLabels.champValeurInvalideErreur);
          return;
        }
        if (
          existingPeriods.some(
            (existing) =>
              IndicateurPeriods.key(existing) === IndicateurPeriods.key(period)
          )
        ) {
          setError(appLabels.indicateurPeriodeExistante);
          return;
        }
        setPending(true);
        try {
          if (await onAdd([period])) {
            setYear('');
            setError('');
          } else setError(appLabels.mutationError);
        } finally {
          setPending(false);
        }
      }}
    >
      <Field title={label} htmlFor={id} small>
        <Input
          type="text"
          id={id}
          value={year}
          inputMode="numeric"
          placeholder={label}
          disabled={pending}
          aria-invalid={Boolean(error)}
          data-test="indicateurs.periodes.year"
          onChange={(event) => {
            setYear(event.target.value);
            setError('');
          }}
        />
        {error && <FieldMessage state="error" message={error} />}
      </Field>
    </form>
  );
};
