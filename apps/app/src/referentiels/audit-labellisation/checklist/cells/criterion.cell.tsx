import { ReactElement, ReactNode } from 'react';
import { BorderedCell } from './bordered.cell';

export const CriterionCell = ({
  criterion,
  criterionAction,
}: {
  criterion: ReactNode;
  criterionAction?: ReactNode;
}): ReactElement => (
  <BorderedCell className="align-middle">
    <div className="group flex items-center gap-2 justify-between">
      <div className="grow">{criterion}</div>
      {criterionAction && (
        <div className="invisible group-hover:visible flex shrink-0">
          {criterionAction}
        </div>
      )}
    </div>
  </BorderedCell>
);
