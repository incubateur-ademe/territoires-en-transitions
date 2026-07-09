'use client';

import type { DemarchePcaetVoletConfig } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { appLabels } from '@/app/labels/catalog';
import { Icon } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { JSX } from 'react';

type VoletTabProps = {
  volet: DemarchePcaetVoletConfig;
  isActive: boolean;
  isComplete: boolean;
  onSelect: () => void;
};

export const VoletTab = ({
  volet,
  isActive,
  isComplete,
  onSelect,
}: VoletTabProps): JSX.Element => (
  <li role="presentation" className="p-0">
    <button
      type="button"
      role="tab"
      id={`demarche-volet-tab-${volet.id}`}
      aria-selected={isActive}
      aria-controls={`demarche-volet-panel-${volet.id}`}
      onClick={onSelect}
      className={cn(
        'group flex w-full flex-col items-center gap-3 rounded-lg border p-4 text-center transition-colors cursor-pointer',
        isActive
          ? 'border-primary-5 bg-primary-0'
          : 'border-grey-3 hover:border-primary-5 hover:bg-primary-0'
      )}
      data-test={`demarche-volet-${volet.id}`}
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          isComplete
            ? 'bg-success-2 text-success-9'
            : 'bg-primary-1 text-primary-9'
        )}
      >
        <Icon icon={volet.icon} size="lg" />
      </span>
      <span className="text-sm font-semibold text-primary-9">{volet.label}</span>
      <span
        className={cn(
          'text-xs font-medium',
          isComplete ? 'text-success-8' : 'text-warning-1'
        )}
      >
        {isComplete
          ? appLabels.demarchePcaetDiagnosticVoletComplete
          : appLabels.demarchePcaetDiagnosticVoletAComplete}
      </span>
    </button>
  </li>
);
