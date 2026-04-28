'use client';

import { SearchHit } from '@tet/domain/search';
import { HighlightedText } from './highlighted-text';
import {
  HIGHLIGHT_TITLE_CLASSES,
  PrimaryBadge,
  SearchResultRowShell,
} from './search-result-row-shell';

export type SearchResultRowDocumentProps = {
  ref?: React.Ref<HTMLLIElement>;
  hit: SearchHit;
  isSelected: boolean;
  onActivate: () => void;
  onMouseEnter?: () => void;
};

/**
 * Document search result row.
 *
 * Documents (`bibliotheque_fichier`) have no dedicated detail page in v1, so
 * activation routes to the collectivité bibliothèque (handled in
 * `useSearchHitNavigation`). The row itself just renders the highlighted
 * filename with a "Document" badge.
 */
export function SearchResultRowDocument({
  ref,
  hit,
  isSelected,
  onActivate,
  onMouseEnter,
}: SearchResultRowDocumentProps) {
  return (
    <SearchResultRowShell
      ref={ref}
      isSelected={isSelected}
      onClick={onActivate}
      onMouseEnter={onMouseEnter}
      hitType="document"
      dataTestSuffix={String(hit.id)}
    >
      <div className="flex items-baseline gap-2">
        <PrimaryBadge label="Document" />
        <HighlightedText html={hit.title} className={HIGHLIGHT_TITLE_CLASSES} />
      </div>
    </SearchResultRowShell>
  );
}
