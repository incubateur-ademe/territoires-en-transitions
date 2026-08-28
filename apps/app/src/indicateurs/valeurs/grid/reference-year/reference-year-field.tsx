'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, InlineEditWrapper, Input } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { JSX, useEffect, useState } from 'react';
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

export const ReferenceYearField = ({
  year,
  years,
  onReferenceYearChange,
}: ReferenceYearFieldProps): JSX.Element => {
  const [text, setText] = useState(year === null ? '' : String(year));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(year === null ? '' : String(year));
    setError(null);
  }, [year]);

  const reset = (): void => {
    setText(year === null ? '' : String(year));
    setError(null);
  };

  const submit = (close: () => void): void => {
    if (text.trim() === '') {
      reset();
      close();
      return;
    }
    const result = parseReferenceYear(text, {
      currentReferenceYear: year,
      years,
    });
    if (result.ok) {
      if (result.year !== year) {
        onReferenceYearChange(result.year);
      }
      setError(null);
      close();
      return;
    }
    setError(errorMessage(result.reason));
  };

  return (
    <div
      className="flex items-center gap-2"
      data-test="indicateurs.valeurs.reference-year"
    >
      <InlineEditWrapper
        floatingMatchReferenceHeight={true}
        onClose={reset}
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
                setText(event.currentTarget.value);
                setError(null);
              }}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submit(() => openState.setIsOpen(false));
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  reset();
                  openState.setIsOpen(false);
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
