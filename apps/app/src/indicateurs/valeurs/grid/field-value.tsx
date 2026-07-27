'use client';

import { cn } from '@tet/ui';
import { JSX, memo, useCallback, useEffect, useState } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { CellInput } from './cell-input';
import { useGridCellServices } from './grid-context';
import { SaveAck } from './save-ack';
import { useCellEdit } from './use-cell-edit';
import {
  ValueWithVariation,
} from './variation/variation-hint';
import {
  NavCellKey,
  IndicateurId,
  ValeurField,
  Year,
} from './types';

type FieldValueProps = {
  field: ValeurField;
  value: number | null;
  editable: boolean;
  rowLabel: string;
  year: Year;
  indicateurId: IndicateurId;
  cellId: NavCellKey;
  fieldLabel: string;
  addLabel: string;
  dotClassName: string;
  withNavigationId: boolean;
  variationToReferenceYear?: number | null;
  hintId?: string;
  onEditingChange?: (isEditing: boolean) => void;
  /** Keep an empty reserved area instead of returning null when no value. */
  reserveSpace?: boolean;
};

export const FieldValue = memo(
  ({
    field,
    value,
    editable,
    rowLabel,
    year,
    indicateurId,
    cellId,
    fieldLabel,
    addLabel,
    dotClassName,
    withNavigationId,
    variationToReferenceYear = null,
    hintId,
    onEditingChange,
    reserveSpace = false,
  }: FieldValueProps): JSX.Element | null => {
    const { saveCellValue } = useGridCellServices();
    const [isEditing, setIsEditing] = useState(false);
    const ariaLabel = appLabels.indicateurCelluleChamp(rowLabel, year, fieldLabel);

    const onSave = useCallback(
      (nextValue: number | null) =>
        saveCellValue({ indicateurId, year, field, value: nextValue }),
      [saveCellValue, indicateurId, year, field]
    );

    const { text, status, onChange, save, cancel } = useCellEdit({
      currentValue: value,
      onSave,
    });

    const stopEditing = useCallback(() => {
      setIsEditing(false);
      onEditingChange?.(false);
    }, [onEditingChange]);

    const startEditing = useCallback(() => {
      if (editable) {
        setIsEditing(true);
        onEditingChange?.(true);
      }
    }, [editable, onEditingChange]);

    const handleSave = useCallback(async () => {
      await save();
      stopEditing();
    }, [save, stopEditing]);

    const handleCancel = useCallback(() => {
      cancel();
      stopEditing();
    }, [cancel, stopEditing]);

    useEffect(() => {
      if (status === 'saved') {
        stopEditing();
      }
    }, [status, stopEditing]);

    const showVariation = variationToReferenceYear !== null && field === 'objectif';

    if (isEditing) {
      const input = (
        <CellInput
          cellId={cellId}
          value={text}
          ariaLabel={ariaLabel}
          describedById={hintId}
          hasError={status === 'error'}
          withNavigationId={withNavigationId}
          onChange={onChange}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );

      return (
        <span className="relative inline-flex items-center justify-center gap-1">
          {showVariation ? (
            <ValueWithVariation
              variationToReferenceYear={variationToReferenceYear}
              hintId={hintId}
            >
              {input}
            </ValueWithVariation>
          ) : (
            input
          )}
          {status === 'saved' && <SaveAck />}
        </span>
      );
    }

    if (value !== null) {
      const content = (
        <>
          <span
            aria-hidden
            className={cn('h-2 w-2 shrink-0 rounded-full', dotClassName)}
          />
          <span>{value}</span>
        </>
      );

      if (editable) {
        return (
          <button
            type="button"
            aria-label={ariaLabel}
            aria-describedby={hintId}
            data-cell-id={withNavigationId ? cellId : undefined}
            onClick={startEditing}
            className="inline-flex h-full items-center justify-center gap-1 rounded px-0.5 py-1 text-sm text-grey-8 outline-none hover:bg-grey-2 focus:ring-2 focus:ring-inset focus:ring-primary-5"
          >
            {showVariation ? (
              <ValueWithVariation
                variationToReferenceYear={variationToReferenceYear}
                hintId={hintId}
                className="items-center"
              >
                {content}
              </ValueWithVariation>
            ) : (
              content
            )}
          </button>
        );
      }

      return (
        <span
          aria-label={ariaLabel}
          className="inline-flex h-full items-center justify-center gap-1 px-0.5 py-1 text-sm text-grey-8"
        >
          {showVariation ? (
            <ValueWithVariation
              variationToReferenceYear={variationToReferenceYear}
              hintId={hintId}
              className="items-center"
            >
              {content}
            </ValueWithVariation>
          ) : (
            content
          )}
        </span>
      );
    }

    if (!editable) {
      if (!reserveSpace) {
        return null;
      }
      return (
        <span
          aria-hidden
          className="inline-flex h-full items-center justify-center text-grey-4"
        >
          —
        </span>
      );
    }

    return (
      <button
        type="button"
        aria-label={addLabel}
        data-cell-id={withNavigationId ? cellId : undefined}
        onClick={startEditing}
        className="inline-flex h-full items-center justify-center rounded px-0.5 py-1 text-xs text-primary-7 outline-none hover:bg-primary-1 focus:ring-2 focus:ring-inset focus:ring-primary-5"
      >
        {addLabel}
      </button>
    );
  }
);

FieldValue.displayName = 'FieldValue';
