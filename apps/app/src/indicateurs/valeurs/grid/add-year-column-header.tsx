'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, cn } from '@tet/ui';
import { JSX, useEffect, useRef, useState } from 'react';
import {
  MAX_ADD_YEAR,
  MIN_ADD_YEAR,
  parseAddYear,
  ParseAddYearResult,
} from './parse-add-year';
import { CELL_ID_ATTRIBUTE, Year } from './types';

type AddYearColumnHeaderProps = {
  years: readonly Year[];
  onAddYear: (year: Year) => void;
  rowSpan?: number;
  /** Called right after `onAddYear`; primarily useful for tests/consumers
   * that want to observe a successful add without depending on the DOM
   * focus side effect below. */
  onAdded?: (year: Year) => void;
};

const errorMessage = (
  reason: Exclude<ParseAddYearResult, { ok: true }>['reason']
): string =>
  reason === 'duplicate'
    ? appLabels.indicateurAnneeDejaPresente
    : appLabels.indicateurAnneeInvalide(MIN_ADD_YEAR, MAX_ADD_YEAR);

export const AddYearColumnHeader = ({
  years,
  onAddYear,
  rowSpan = 1,
  onAdded,
}: AddYearColumnHeaderProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingFocusYear, setPendingFocusYear] = useState<Year | null>(null);
  const thRef = useRef<HTMLTableCellElement>(null);

  // The new column only exists in the DOM once the parent has re-rendered
  // with the updated `years`. We wait for that instead of guessing timing
  // (e.g. requestAnimationFrame), so this stays correct regardless of how
  // the parent schedules its state update.
  useEffect(() => {
    if (pendingFocusYear === null || !years.includes(pendingFocusYear)) {
      return;
    }
    const table = thRef.current?.closest('table') ?? null;
    const resultatTarget = table?.querySelector<HTMLElement>(
      `[${CELL_ID_ATTRIBUTE}$=":${pendingFocusYear}:resultat"]`
    );
    const objectifTarget = table?.querySelector<HTMLElement>(
      `[${CELL_ID_ATTRIBUTE}$=":${pendingFocusYear}:objectif"]`
    );
    (resultatTarget ?? objectifTarget)?.focus();
    setPendingFocusYear(null);
  }, [years, pendingFocusYear]);

  const startEditing = (): void => {
    setText('');
    setError(null);
    setIsEditing(true);
  };

  const reset = (): void => {
    setIsEditing(false);
    setText('');
    setError(null);
  };

  const submit = (): void => {
    if (text.trim() === '') {
      reset();
      return;
    }
    const result = parseAddYear(text, years);
    if (result.ok) {
      onAddYear(result.year);
      onAdded?.(result.year);
      setPendingFocusYear(result.year);
      reset();
      return;
    }
    setError(errorMessage(result.reason));
  };

  return (
    <th
      ref={thRef}
      scope="col"
      rowSpan={rowSpan}
      role="columnheader"
      className="sticky right-0 top-0 z-20 min-w-[90px] bg-grey-1 py-2 pl-2 pr-3 text-right"
    >
      {isEditing ? (
        <div className="flex flex-col items-end gap-1">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            aria-label={appLabels.indicateurAjouterAnneeChamp}
            aria-invalid={error !== null}
            value={text}
            onChange={(event) => {
              setText(event.currentTarget.value);
              setError(null);
            }}
            onBlur={submit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                reset();
              }
            }}
            className={cn(
              'w-20 rounded border border-grey-4 bg-white px-1 py-0.5 text-right text-sm text-grey-8 outline-none focus:ring-2 focus:ring-inset focus:ring-primary-5',
              error !== null &&
                'border-error-1 text-error-1 ring-2 ring-inset ring-error-1'
            )}
          />
          {error !== null && (
            <span role="alert" className="text-xs font-normal text-error-1">
              {error}
            </span>
          )}
        </div>
      ) : (
        <Button
          aria-label={appLabels.indicateurAjouterAnnee}
          onClick={startEditing}
          icon={'add-line'}
          size="xs"
          variant="white"
        >
          {'Année'}
        </Button>
      )}
    </th>
  );
};
