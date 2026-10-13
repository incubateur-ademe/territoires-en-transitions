import { appLabels } from '@/app/labels/catalog';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
  type IndicateurPeriodeAnnuelle,
} from '@tet/domain/indicateurs';
import { Button, Field, Input, Tooltip } from '@tet/ui';
import { type ComponentProps, useEffect, useId, useRef, useState } from 'react';

const editorOptions = {
  [IndicateurPeriodiciteEnum.ANNUELLE]: {
    add: appLabels.ajouterAnnee,
    duplicate: appLabels.indicateurAnneeExistante,
    submit: appLabels.validerAjouterAnnee,
    inputMode: 'numeric',
  },
} satisfies Record<
  IndicateurPeriodeAnnuelle['periodicite'],
  {
    add: string;
    duplicate: string;
    submit: string;
    inputMode: ComponentProps<'input'>['inputMode'];
  }
>;

export const AddIndicateurPeriodeHeader = ({
  periodicite,
  existingPeriodes,
  onAdd,
  focusRequested = false,
  onFocusHandled,
}: {
  periodicite: IndicateurPeriodeAnnuelle['periodicite'];
  existingPeriodes: readonly IndicateurPeriodeAnnuelle[];
  onAdd: (periode: IndicateurPeriodeAnnuelle) => Promise<boolean>;
  focusRequested?: boolean;
  onFocusHandled?: () => void;
}) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const editor = editorOptions[periodicite];
  const existingKeys = new Set(existingPeriodes.map(IndicateurPeriodes.key));
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsedPeriode = IndicateurPeriodes.tryParse(periodicite, draft);
  const hasDuplicate = parsedPeriode
    ? existingKeys.has(IndicateurPeriodes.key(parsedPeriode))
    : false;
  const canSubmit = Boolean(parsedPeriode) && !hasDuplicate && !isSubmitting;
  const errorMessage = hasDuplicate ? editor.duplicate : submitError;
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
            type="text"
            displaySize="sm"
            containerClassname="max-w-[8.5rem]"
            value={draft}
            onChange={(event) => {
              const nextDraft = IndicateurPeriodes.normalizeDraft(
                periodicite,
                event.target.value
              );
              if (nextDraft === null) return;
              setSubmitError(null);
              setDraft(nextDraft);
            }}
            id={id}
            inputMode={editor.inputMode}
            aria-label={editor.add}
            placeholder={editor.add}
            disabled={isSubmitting}
            aria-invalid={isInvalid}
            data-test="indicateurs.periodes.input"
          />
          {canSubmit ? (
            <Tooltip label={editor.add}>
              <Button
                type="submit"
                size="sm"
                variant="grey"
                icon="check-line"
                aria-label={editor.submit}
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
