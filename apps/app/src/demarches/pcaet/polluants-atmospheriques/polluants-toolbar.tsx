'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Input } from '@tet/ui';
import { JSX, useState } from 'react';

export type ViewMode = 'flat' | 'tabs';

const ReferenceYearField = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (year: number) => void;
}): JSX.Element => {
  const [text, setText] = useState(String(value));
  return (
    <Input
      id="reference-year"
      type="text"
      displaySize="sm"
      aria-label={appLabels.demarchePcaetPolluantsAnneeReference}
      containerClassname="w-24"
      value={text}
      onChange={(event) => setText(event.currentTarget.value)}
      onBlur={() => {
        const year = Number.parseInt(text, 10);
        if (Number.isInteger(year) && year > 0) {
          onChange(year);
          return;
        }
        setText(String(value));
      }}
    />
  );
};

export const PolluantsToolbar = ({
  referenceYear,
  onReferenceYearChange,
  viewMode,
  onViewModeChange,
}: {
  referenceYear: number;
  onReferenceYearChange: (year: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}): JSX.Element => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <label
        htmlFor="reference-year"
        className="text-sm font-medium text-primary-9"
      >
        {appLabels.demarchePcaetPolluantsAnneeReference}
      </label>
      <ReferenceYearField
        value={referenceYear}
        onChange={onReferenceYearChange}
      />
    </div>

    <div className="flex gap-1">
      <Button
        size="sm"
        variant={viewMode === 'flat' ? undefined : 'outlined'}
        onClick={() => onViewModeChange('flat')}
      >
        {appLabels.demarchePcaetPolluantsVueAPlat}
      </Button>
      <Button
        size="sm"
        variant={viewMode === 'tabs' ? undefined : 'outlined'}
        onClick={() => onViewModeChange('tabs')}
      >
        {appLabels.demarchePcaetPolluantsParSecteur}
      </Button>
    </div>
  </div>
);
