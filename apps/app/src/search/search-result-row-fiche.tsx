'use client';

import { SearchHit } from '@tet/domain/search';
import { HighlightedText } from './highlighted-text';
import {
  HIGHLIGHT_SNIPPET_CLASSES,
  HIGHLIGHT_TITLE_CLASSES,
  PrimaryBadge,
  SearchResultRowShell,
} from './search-result-row-shell';

export type SearchResultRowFicheProps = {
  ref?: React.Ref<HTMLLIElement>;
  hit: SearchHit;
  isSelected: boolean;
  onActivate: () => void;
  onMouseEnter?: () => void;
};

/**
 * Fiche-action search result row.
 *
 * The "Action" / "Sous-action" distinction hinges on `contextFields.parentId`
 * (per the U7 SearchService projection): a top-level fiche has `parentId ===
 * null`, a sub-fiche has a numeric parent.
 *
 * Defensive: missing `contextFields` defaults to top-level Action.
 */
export function SearchResultRowFiche({
  ref,
  hit,
  isSelected,
  onActivate,
  onMouseEnter,
}: SearchResultRowFicheProps) {
  const ctx = hit.contextFields ?? {};
  const parentId = ctx['parentId'];
  const isSousAction = parentId !== null && parentId !== undefined;
  const badgeLabel = isSousAction ? 'Sous-action' : 'Action';

  return (
    <SearchResultRowShell
      ref={ref}
      isSelected={isSelected}
      onClick={onActivate}
      onMouseEnter={onMouseEnter}
      hitType="fiche"
      dataTestSuffix={String(hit.id)}
    >
      <div className="flex items-baseline gap-2">
        <PrimaryBadge label={badgeLabel} />
        <HighlightedText html={hit.title} className={HIGHLIGHT_TITLE_CLASSES} />
      </div>
      {hit.snippet && (
        <HighlightedText
          as="p"
          html={hit.snippet}
          className={HIGHLIGHT_SNIPPET_CLASSES}
        />
      )}
    </SearchResultRowShell>
  );
}
