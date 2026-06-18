'use client';

import { appLabels } from '@/app/labels/catalog';
import { ButtonGroup, Checkbox, Select } from '@tet/ui';
import { JSX } from 'react';

export type ViewMode = 'flat' | 'tabs';

export const PolluantsToolbar = ({
  availableYears,
  referenceYear,
  onReferenceYearChange,
  viewMode,
  onViewModeChange,
  openDataAvailableCount,
  showOpenData,
  onShowOpenDataChange,
}: {
  availableYears: number[];
  referenceYear: number;
  onReferenceYearChange: (year: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  openDataAvailableCount: number;
  showOpenData: boolean;
  onShowOpenDataChange: (show: boolean) => void;
}): JSX.Element => (
  <div className="relative z-10 flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-primary-9 whitespace-nowrap">
        {appLabels.demarchePcaetPolluantsAnneeReference} :
      </span>
      <div className="w-24">
        <Select
          small
          options={availableYears.map((y) => ({ value: y, label: String(y) }))}
          values={referenceYear}
          onChange={(v) =>
            v !== undefined && onReferenceYearChange(Number(v))
          }
        />
      </div>
    </div>

    {openDataAvailableCount > 0 && (
      <Checkbox
        variant="switch"
        checked={showOpenData}
        onChange={(event) => onShowOpenDataChange(event.currentTarget.checked)}
        label={appLabels.demarchePcaetPolluantsAfficherOpenData({
          count: openDataAvailableCount,
        })}
      />
    )}

    <div className="ml-auto">
      <ButtonGroup
        size="sm"
        activeButtonId={viewMode}
        buttons={[
          {
            id: 'flat',
            icon: 'list-unordered',
            children: appLabels.demarchePcaetPolluantsVueAPlat,
            onClick: () => onViewModeChange('flat'),
          },
          {
            id: 'tabs',
            icon: 'grid-line',
            children: appLabels.demarchePcaetPolluantsParSecteur,
            onClick: () => onViewModeChange('tabs'),
          },
        ]}
      />
    </div>
  </div>
);
