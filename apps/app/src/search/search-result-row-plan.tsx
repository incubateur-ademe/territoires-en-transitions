'use client';

import { SearchHit } from '@tet/domain/search';
import { HighlightedText } from './highlighted-text';
import {
  HIGHLIGHT_TITLE_CLASSES,
  PrimaryBadge,
  SearchResultRowShell,
} from './search-result-row-shell';

export type SearchResultRowPlanProps = {
  ref?: React.Ref<HTMLLIElement>;
  hit: SearchHit;
  isSelected: boolean;
  onActivate: () => void;
  onMouseEnter?: () => void;
};

/**
 * Plan / Axe search result row.
 *
 * Both root plans (`parent === null`) and sub-axes (`parent` set) live
 * in the same `plans` index. The badge label switches based on `parent` —
 * mirrors the Action / Sous-action distinction used by `search-result-row-fiche`.
 */
export function SearchResultRowPlan({
  ref,
  hit,
  isSelected,
  onActivate,
  onMouseEnter,
}: SearchResultRowPlanProps) {
  const ctx = hit.contextFields ?? {};
  const parent = ctx['parent'];
  const isAxe = parent !== null && parent !== undefined;
  return (
    <SearchResultRowShell
      ref={ref}
      isSelected={isSelected}
      onClick={onActivate}
      onMouseEnter={onMouseEnter}
      hitType="plan"
      dataTestSuffix={String(hit.id)}
    >
      <div className="flex items-baseline gap-2">
        <PrimaryBadge label={isAxe ? 'Axe' : 'Plan'} />
        <HighlightedText html={hit.title} className={HIGHLIGHT_TITLE_CLASSES} />
      </div>
    </SearchResultRowShell>
  );
}
