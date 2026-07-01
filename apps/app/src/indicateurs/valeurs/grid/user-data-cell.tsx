import { JSX, memo } from 'react';
import { CoveringSource } from './types';

export const UserDataCell = memo(
  ({
    value,
    coveringSources,
  }: {
    value: number | null;
    coveringSources: CoveringSource[];
  }): JSX.Element => {
    const isEmpty = value === null;
    const showCoverageDot = isEmpty && coveringSources.length > 0;
    return (
      <div className="relative flex h-full items-center justify-end px-3 text-sm">
        {!isEmpty && <span className="text-primary-9">{value}</span>}
        {showCoverageDot && (
          <span
            aria-hidden
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-success-1 ring-2 ring-success-2"
          />
        )}
      </div>
    );
  }
);

UserDataCell.displayName = 'UserDataCell';
