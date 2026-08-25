'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, cn, InlineEditWrapper, Input, TableHeaderCell } from '@tet/ui';
import { JSX, useEffect, useRef, useState } from 'react';
import {
  MAX_ADD_YEAR,
  MIN_ADD_YEAR,
  parseAddYear,
  ParseAddYearResult,
} from './parse-add-year';
import { STICKY_RIGHT_SHADOW_CLASSNAME } from './scroll-shadow';
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
  onAdded,
}: AddYearColumnHeaderProps): JSX.Element => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingFocusYear, setPendingFocusYear] = useState<Year | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  // The new column only exists in the DOM once the parent has re-rendered
  // with the updated `years`. We wait for that instead of guessing timing
  // (e.g. requestAnimationFrame), so this stays correct regardless of how
  // the parent schedules its state update.
  useEffect(() => {
    if (pendingFocusYear === null || !years.includes(pendingFocusYear)) {
      return;
    }
    const table = cellRef.current?.closest('table') ?? null;
    const resultatTarget = table?.querySelector<HTMLElement>(
      `[${CELL_ID_ATTRIBUTE}$=":${pendingFocusYear}:resultat"]`
    );
    const objectifTarget = table?.querySelector<HTMLElement>(
      `[${CELL_ID_ATTRIBUTE}$=":${pendingFocusYear}:objectif"]`
    );
    (resultatTarget ?? objectifTarget)?.focus();
    setPendingFocusYear(null);
  }, [years, pendingFocusYear]);

  const reset = (): void => {
    setText('');
    setError(null);
  };

  const submit = (close: () => void): void => {
    if (text.trim() === '') {
      reset();
      close();
      return;
    }
    const result = parseAddYear(text, years);
    if (result.ok) {
      onAddYear(result.year);
      onAdded?.(result.year);
      setPendingFocusYear(result.year);
      reset();
      close();
      return;
    }
    setError(errorMessage(result.reason));
  };

  return (
    <TableHeaderCell
      scope="col"
      className={cn(
        'sticky right-0 top-0 z-20 p-1 align-middle whitespace-nowrap bg-white w-24',
        STICKY_RIGHT_SHADOW_CLASSNAME
      )}
    >
      <div ref={cellRef}>
        <InlineEditWrapper
          floatingMatchReferenceHeight={false}
          onClose={reset}
          renderOnEdit={({ openState }) => (
            <div className="flex flex-col items-end gap-1 ">
              <Input
                type="text"
                inputMode="numeric"
                autoFocus
                displaySize="sm"
                containerClassname="w-20"
                aria-label={appLabels.indicateurAjouterAnneeChamp}
                aria-invalid={error !== null}
                state={error !== null ? 'error' : undefined}
                value={text}
                onChange={(event) => {
                  setText(event.currentTarget.value);
                  setError(null);
                }}
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
          <Button
            aria-label={appLabels.indicateurAjouterAnnee}
            icon="add-line"
            size="xs"
            variant="white"
          >
            {'Année'}
          </Button>
        </InlineEditWrapper>
      </div>
    </TableHeaderCell>
  );
};
