'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, InlineEditWrapper, Input } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { JSX, useEffect, useRef, useState } from 'react';
import {
  maxReferenceYear,
  MIN_REFERENCE_YEAR,
  parseReferenceYear,
  ParseReferenceYearResult,
} from './parse-reference-year';

type ReferenceYearFieldProps = {
  year: number | null;
  years: readonly number[];
  onReferenceYearChange: (year: number) => void;
  showLabel?: boolean;
};

const errorMessage = (
  reason: Exclude<ParseReferenceYearResult, { ok: true }>['reason']
): string =>
  reason === 'duplicate'
    ? appLabels.indicateurAnneeDejaPresente
    : appLabels.indicateurAnneeReferenceInvalide(
        MIN_REFERENCE_YEAR,
        maxReferenceYear()
      );

const displayedYear = (year: number | null): string =>
  year === null ? appLabels.indicateurAnneeReferencePlaceholder : String(year);

const displayedText = (year: number | null): string =>
  year === null ? '' : String(year);

export const ReferenceYearField = ({
  year,
  years,
  onReferenceYearChange,
}: ReferenceYearFieldProps): JSX.Element => {
  const [text, setText] = useState(displayedText(year));
  const [error, setError] = useState<string | null>(null);
  // La fermeture du champ peut être notifiée plusieurs fois pour un même
  // clic (fermeture explicite + détection du clic extérieur). Ces refs
  // rendent l'enregistrement idempotent : la saisie courante et la dernière
  // année enregistrée y sont lues sans attendre le rendu suivant.
  const textRef = useRef(text);
  const committedRef = useRef(year);

  const changeText = (value: string): void => {
    textRef.current = value;
    setText(value);
  };

  // Réaffiche l'année enregistrée quand elle change. L'ajuster pendant le
  // rendu, plutôt que dans un effet, évite d'afficher un instant l'année
  // précédente une fois l'enregistrement confirmé.
  const [previousYear, setPreviousYear] = useState(year);
  if (previousYear !== year) {
    setPreviousYear(year);
    setText(displayedText(year));
    setError(null);
  }

  // Les refs, elles, ne peuvent être écrites que pendant la phase de commit.
  useEffect(() => {
    committedRef.current = year;
    textRef.current = displayedText(year);
  }, [year]);

  const reset = (): void => {
    changeText(displayedText(committedRef.current));
    setError(null);
  };

  /** Enregistre la saisie ; renvoie false si elle est invalide. */
  const commit = (): boolean => {
    const raw = textRef.current;
    if (raw.trim() === '') {
      reset();
      return true;
    }
    const result = parseReferenceYear(raw, {
      currentReferenceYear: committedRef.current,
      years,
    });
    if (!result.ok) {
      setError(errorMessage(result.reason));
      return false;
    }
    if (result.year !== committedRef.current) {
      committedRef.current = result.year;
      onReferenceYearChange(result.year);
    }
    setError(null);
    return true;
  };

  /** Clic à côté du champ : la saisie est enregistrée, sinon abandonnée. */
  const handleClose = (): void => {
    if (!commit()) {
      reset();
    }
  };

  const submit = (close: () => void): void => {
    if (commit()) {
      close();
    }
  };

  const cancel = (close: () => void): void => {
    reset();
    close();
  };

  return (
    <div
      className="flex items-center gap-2"
      data-test="indicateurs.valeurs.reference-year"
    >
      <InlineEditWrapper
        floatingMatchReferenceHeight={true}
        onClose={handleClose}
        renderOnEdit={({ openState }) => (
          <div className="flex flex-col items-start gap-1">
            <Input
              type="text"
              inputMode="numeric"
              autoFocus
              // displaySize="sm"
              containerClassname="w-44"
              aria-label={appLabels.indicateurAnneeReferenceChamp}
              aria-invalid={error !== null}
              state={error !== null ? 'error' : undefined}
              value={text}
              onChange={(event) => {
                changeText(event.currentTarget.value);
                setError(null);
              }}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submit(() => openState.setIsOpen(false));
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  cancel(() => openState.setIsOpen(false));
                }
              }}
            />
            {error !== null && (
              <span
                role="alert"
                className="text-sm font-normal text-error-1 p-1"
              >
                {error}
              </span>
            )}
          </div>
        )}
      >
        <Button
          variant={text.trim() === '' ? 'outlined' : 'grey'}
          className={cn(
            ' px-2 py-1 underline decoration-dotted underline-offset-2',
            year === null ? 'text-grey-6' : 'text-primary-9'
          )}
          aria-label={appLabels.indicateurAnneeReferenceChamp}
        >
          {displayedYear(year)}
        </Button>
      </InlineEditWrapper>
    </div>
  );
};
