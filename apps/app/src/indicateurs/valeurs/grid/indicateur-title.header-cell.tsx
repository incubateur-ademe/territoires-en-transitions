import { TableHeaderCell, VisibleWhen } from '@tet/ui';
import { JSX } from 'react';

type Props = {
  title: string;
  unit: string;
};

export const IndicateurHeaderTitleCell = ({
  title,
  unit,
}: Props): JSX.Element => (
  <TableHeaderCell pinnedLeft className="w-80 min-w-64">
    <div className="flex flex-col text-left text-base">
      <span className="font-bold text-primary-9">{title}</span>
      <VisibleWhen condition={unit !== null}>
        <span className="text-sm text-grey-8">{unit}</span>
      </VisibleWhen>
    </div>
  </TableHeaderCell>
);
