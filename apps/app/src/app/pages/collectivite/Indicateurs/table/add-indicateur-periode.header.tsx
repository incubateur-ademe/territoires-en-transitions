import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
  type IndicateurPeriode,
} from '@tet/domain/indicateurs';
import { Button, Field, Input, Tooltip } from '@tet/ui';
import { useEffect, useId, useRef, useState } from 'react';

const editorLabels = {
  [IndicateurPeriodiciteEnum.ANNUELLE]: {
    add: appLabels.ajouterAnnee,
    duplicate: appLabels.indicateurAnneeExistante,
  },
} satisfies Record<
  IndicateurPeriode['periodicite'],
  { add: string; duplicate: string }
>;

export const AddIndicateurPeriodeHeader = ({
  periodicite,
  existingPeriodes,
  onAdd,
  focusRequested = false,
  onFocusHandled,
}: {
  periodicite: IndicateurPeriode['periodicite'];
  existingPeriodes: readonly IndicateurPeriode[];
  onAdd: (periode: IndicateurPeriode) => Promise<boolean>;
  focusRequested?: boolean;
  onFocusHandled?: () => void;
}) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const labels = editorLabels[periodicite];
  const existingKeys = new Set(existingPeriodes.map(IndicateurPeriodes.key));
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsedPeriode = IndicateurPeriodes.parse(periodicite, draft);
  const hasDuplicate = parsedPeriode
    ? existingKeys.has(IndicateurPeriodes.key(parsedPeriode))
    : false;
  const canSubmit = Boolean(parsedPeriode) && !hasDuplicate && !isSubmitting;
  const errorMessage = hasDuplicate ? labels.duplicate : submitError;
  const isInvalid = hasDuplicate;

  useEffect(() => {
    if (focusRequested) {
      inputRef.current?.focus();
      onFocusHandled?.();
    }
  }, [focusRequested, onFocusHandled]);

  const submit = async (refocus: boolean) => {
    if (!parsedPeriode || hasDuplicate || isSubmittingRef.current) return false;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    let shouldRefocus = false;
    try {
      if (await onAdd(parsedPeriode)) {
        setDraft('');
        shouldRefocus = refocus;
        return true;
      }
    } catch {
      // Le brouillon reste disponible pour une nouvelle tentative.
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      if (shouldRefocus) {
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
    setSubmitError(appLabels.mutationError);
    return false;
  };

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        return submit(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          void submit(false);
        }
      }}
    >
      <Field
        small
        state={errorMessage ? 'error' : 'default'}
        message={errorMessage ?? undefined}
      >
        <div className="flex items-stretch gap-2">
          <Input
            ref={inputRef}
            type="number"
            numType="int"
            displaySize="sm"
            containerClassname="max-w-[8.5rem]"
            value={draft}
            allowNegative={false}
            thousandSeparator={false}
            isAllowed={({ value }) => value.length <= 4}
            onValueChange={({ value: raw }) => {
              setSubmitError(null);
              setDraft(raw);
            }}
            id={id}
            inputMode="numeric"
            aria-label={labels.add}
            placeholder={labels.add}
            disabled={isSubmitting}
            aria-invalid={isInvalid}
            data-test="indicateurs.periodes.input"
          />
          {canSubmit ? (
            <Tooltip label={labels.add}>
              <Button
                type="submit"
                size="sm"
                variant="grey"
                icon="check-line"
                aria-label={appLabels.validerAjouterAnnee}
                dataTest="indicateurs.periodes.submit"
                disabled={isSubmitting}
              />
            </Tooltip>
          ) : null}
        </div>
      </Field>
    </form>
  );
};
