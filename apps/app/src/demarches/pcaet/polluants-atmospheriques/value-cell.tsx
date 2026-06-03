'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button, Input, cn } from '@tet/ui';
import { JSX, useState } from 'react';
import { GridCell } from './grid-model';
import { parseFrenchNumber } from './paste-values';

const valueToText = (value: number | null): string =>
  value === null ? '' : value.toString();

const formatPercentage = (percentage: number): string => {
  const rounded = Math.round(percentage * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${`${rounded}`.replace('.', ',')} %`;
};

export const ValueCell = ({
  cell,
  indicateurId,
  pollutantLabel,
  sectorLabel,
  showOpenData,
  onFocus,
  onCommit,
}: {
  cell: GridCell;
  indicateurId: number | null;
  pollutantLabel: string;
  sectorLabel: string;
  showOpenData: boolean;
  onFocus: () => void;
  onCommit: (value: number | null) => void;
}): JSX.Element => {
  const [text, setText] = useState<string | null>(null);
  const editable = indicateurId !== null;
  const proposed =
    showOpenData && cell.proposal !== null ? cell.proposal : null;

  return (
    <td className={cn('border border-grey-3 p-0', { 'bg-grey-1': !editable })}>
      <div className="flex items-center justify-end gap-1 pr-2">
        <Input
          type="text"
          displaySize="sm"
          aria-label={appLabels.demarchePcaetPolluantsCelluleAriaLabel({
            polluant: pollutantLabel,
            secteur: sectorLabel,
            annee: cell.year,
          })}
          disabled={!editable}
          className="text-right placeholder:italic"
          containerClassname="grow rounded-none border-none bg-transparent focus-within:ring-1 focus-within:ring-inset focus-within:ring-primary-5"
          value={text ?? valueToText(cell.value)}
          placeholder={proposed === null ? undefined : valueToText(proposed)}
          onFocus={onFocus}
          onChange={(event) => setText(event.currentTarget.value)}
          onBlur={(event) => {
            const analysis = parseFrenchNumber(event.currentTarget.value);
            setText(null);
            if (!editable || analysis.status === 'invalid') {
              return;
            }
            onCommit(analysis.status === 'ok' ? analysis.value : null);
          }}
        />
        {proposed !== null && editable && (
          <Button
            size="xs"
            variant="white"
            icon="check-line"
            title={appLabels.demarchePcaetPolluantsUtiliserOpenData}
            onClick={() => onCommit(proposed)}
          />
        )}
        {cell.percentageVsReference !== null && (
          <span className="shrink-0 whitespace-nowrap text-xs text-grey-6">
            {formatPercentage(cell.percentageVsReference)}
          </span>
        )}
      </div>
    </td>
  );
};
