'use client';

import { appLabels } from '@/app/labels/catalog';
import { InlineEditWrapper, Input } from '@tet/ui';
import { JSX, useEffect, useState } from 'react';
import { Year } from '../types';
import {
  maxReferenceYear,
  MIN_REFERENCE_YEAR,
  parseReferenceYear,
  ParseReferenceYearResult,
} from './parse-reference-year';

type ReferenceYearFieldProps = {
  year: Year;
  years: readonly Year[];
  onReferenceYearChange: (year: Year) => void;
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

export const ReferenceYearField = ({
  year,
  years,
  onReferenceYearChange,
}: ReferenceYearFieldProps): JSX.Element => {
  const [text, setText] = useState(String(year));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(String(year));
    setError(null);
  }, [year]);

  const reset = (): void => {
    setText(String(year));
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
      <span className="text-sm font-medium text-grey-8">
        {appLabels.indicateurAnneeReferenceChamp}
      </span>
      <InlineEditWrapper
        floatingMatchReferenceHeight={false}
        onClose={reset}
        renderOnEdit={({ openState }) => (
          <div className="flex flex-col items-end gap-1">
            <Input
              type="text"
              inputMode="numeric"
              autoFocus
              displaySize="sm"
              containerClassname="w-20"
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
              <span role="alert" className="text-xs font-normal text-error-1">
                {error}
              </span>
            )}
          </div>
        )}
      >
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-grey-4 bg-white px-2 py-1 text-sm font-bold text-primary-9 underline decoration-dotted underline-offset-2"
          aria-label={appLabels.indicateurAnneeReferenceChamp}
        >
          {year}
        </button>
      </InlineEditWrapper>
    </div>
  );
};
