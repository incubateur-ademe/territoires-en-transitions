'use client';

import { cn } from '@tet/ui/utils/cn';
import { ReactNode } from 'react';

export type RowShellProps = {
  ref?: React.Ref<HTMLLIElement>;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  hitType: string;
  /** A short identifying suffix added to data-test for assertions. */
  dataTestSuffix?: string;
  children: ReactNode;
};

/**
 * Shared visual chrome for all per-entity result rows: list-item semantics,
 * selected-row tint, hover state, click + hover handlers. Keeps every row
 * pixel-aligned regardless of which entity-specific component renders inside.
 */
export function SearchResultRowShell({
  ref,
  isSelected,
  onClick,
  onMouseEnter,
  hitType,
  dataTestSuffix,
  children,
}: RowShellProps) {
  return (
    <li
      ref={ref}
      role="option"
      aria-selected={isSelected}
      data-test-hit-type={hitType}
      data-test={
        dataTestSuffix
          ? `SearchResultRow-${hitType}-${dataTestSuffix}`
          : `SearchResultRow-${hitType}`
      }
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex flex-col gap-1 px-3 py-2 rounded cursor-pointer transition-colors',
        'active:bg-primary-2',
        isSelected
          ? 'bg-primary-1 ring-1 ring-primary-5'
          : 'hover:bg-grey-2'
      )}
    >
      {children}
    </li>
  );
}

/**
 * Default highlight + snippet styling shared by every row. Used as the
 * className for the wrapper holding `<HighlightedText />` so `<mark>` tokens
 * render uniformly.
 */
export const HIGHLIGHT_TITLE_CLASSES =
  'text-sm text-grey-10 [&_mark]:bg-yellow-200 [&_mark]:text-inherit [&_mark]:rounded-sm [&_mark]:px-0.5';

export const HIGHLIGHT_SNIPPET_CLASSES =
  'mb-0 text-xs text-grey-8 line-clamp-2 [&_mark]:bg-yellow-200 [&_mark]:text-inherit [&_mark]:rounded-sm [&_mark]:px-0.5';

/**
 * Solid pill used for primary type badges ("Plan", "Action", etc.). Keeps the
 * exact look the U9 generic row had so U10 rows feel familiar.
 */
export function PrimaryBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-grey-3 text-grey-9',
        className
      )}
    >
      {label}
    </span>
  );
}

/**
 * Lighter pill used for secondary tags ("Personnalisé", "Mesure · Sous-action"
 * sub-tier). Visually demoted from `<PrimaryBadge />`.
 */
export function SecondaryBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium border border-primary-5 text-primary-9 bg-primary-1',
        className
      )}
    >
      {label}
    </span>
  );
}
