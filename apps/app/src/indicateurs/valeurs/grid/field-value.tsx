'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { JSX, memo, useCallback, useEffect, useState } from 'react';
import { CellInput } from './cell-input';
import { useGridCellServices } from './grid-context';
import { SaveAck } from './save-ack';
import { IndicateurId, NavCellKey, ValeurField, Year } from './types';
import { useCellEdit } from './use-cell-edit';
import { ValueFieldBadge } from './value-field.badge';
import { ValueWithVariation } from './variation/variation-hint';

type FieldValueProps = {
  field: ValeurField;
  value: number | null;

  rowLabel: string;
  year: Year;
  indicateurId: IndicateurId;
  cellId: NavCellKey;
  fieldLabel: string;
  addLabel: string;
  withNavigationId: boolean;
  variationToReferenceYear?: number | null;
  hintId?: string;
  onEditingChange?: (isEditing: boolean) => void;
};

export const FieldValue = memo(
  ({
    field,
    value,

    rowLabel,
    year,
    indicateurId,
    cellId,
    fieldLabel,
    addLabel,
    withNavigationId,
    variationToReferenceYear = null,
    hintId,
    onEditingChange,
  }: FieldValueProps): JSX.Element | null => {
    const { saveCellValue } = useGridCellServices();
    const [isEditing, setIsEditing] = useState(false);
    const ariaLabel = appLabels.indicateurCelluleChamp(
      rowLabel,
      year,
      fieldLabel
    );

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
      setIsEditing(true);
      onEditingChange?.(true);
    }, [onEditingChange]);

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

    const showVariation =
      variationToReferenceYear !== null && field === 'objectif';

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
          <span>{value}</span>
          <ValueFieldBadge field={field} />
        </>
      );

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
      <Button
        size="xs"
        variant="white"
        aria-label={addLabel}
        data-cell-id={withNavigationId ? cellId : undefined}
        onClick={startEditing}
      >
        {addLabel}
      </Button>
    );
  }
);

FieldValue.displayName = 'FieldValue';
