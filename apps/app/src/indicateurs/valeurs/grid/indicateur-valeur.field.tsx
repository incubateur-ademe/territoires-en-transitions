'use client';

import { appLabels } from '@/app/labels/catalog';
import { cn, Input } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { ComponentProps, ReactNode } from 'react';
import { IndicateurValeurTypeBadge } from './indicateur-valeur-type.badge';
import type { IndicateurValeurField } from './types';
import type { CellEdit } from './use-cell-edit';

export const getIndicateurValeurFieldLabel = (
  type: IndicateurValeurField,
  periodeLabel?: string
): string => {
  const label = capitalize(
    type === 'resultat'
      ? appLabels.indicateurResultat()
      : appLabels.indicateurObjectif()
  );
  return periodeLabel === undefined
    ? label
    : appLabels.indicateurChampValeur(label, periodeLabel);
};

export const IndicateurValeurContent = ({
  type,
  children,
  className,
}: {
  type: IndicateurValeurField;
  children: ReactNode;
  className?: string;
}) => (
  <span className={cn('inline-flex items-center gap-2', className)}>
    <IndicateurValeurTypeBadge indicateurValeurType={type} />
    {children}
  </span>
);

type InputProps = {
  type: IndicateurValeurField;
  edit: CellEdit;
  periodeLabel?: string;
  isRequired?: boolean;
  /** PCAET keeps its formatted numeric input; text preserves annual input precision. */
  inputType?: 'number' | 'text';
  displaySize?: Extract<
    ComponentProps<typeof Input>,
    { type: 'number' }
  >['displaySize'];
  containerClassname?: string;
  'data-test'?: string;
  onCommit: () => void;
  onCancel: () => void;
  onBlur?: () => void;
};

/** Keyboard and numeric draft UI shared by floating and inline editors. */
export const IndicateurValeurInput = ({
  type,
  edit,
  periodeLabel,
  isRequired,
  inputType = 'number',
  displaySize,
  containerClassname = 'grow border-none',
  'data-test': dataTest,
  onCommit,
  onCancel,
  onBlur,
}: InputProps) => (
  <Input
    {...(inputType === 'number'
      ? ({ type: 'number', numType: 'float' } as const)
      : ({ type: 'text' } as const))}
    inputMode="decimal"
    autoFocus
    displaySize={displaySize}
    containerClassname={containerClassname}
    aria-label={getIndicateurValeurFieldLabel(type, periodeLabel)}
    aria-invalid={edit.status === 'error'}
    aria-busy={edit.status === 'saving'}
    aria-required={isRequired}
    value={edit.text}
    onFocus={(event) => event.currentTarget.select()}
    onChange={(event) => edit.onChange(event.currentTarget.value)}
    onBlur={onBlur}
    onKeyDown={(event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onCommit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        edit.cancel();
        onCancel();
      }
    }}
    data-test={dataTest}
  />
);
