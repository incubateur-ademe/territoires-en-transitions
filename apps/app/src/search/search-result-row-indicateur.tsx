'use client';

import { SearchHit } from '@tet/domain/search';
import { HighlightedText } from './highlighted-text';
import {
  HIGHLIGHT_SNIPPET_CLASSES,
  HIGHLIGHT_TITLE_CLASSES,
  PrimaryBadge,
  SearchResultRowShell,
  SecondaryBadge,
} from './search-result-row-shell';

export type SearchResultRowIndicateurProps = {
  ref?: React.Ref<HTMLLIElement>;
  hit: SearchHit;
  isSelected: boolean;
  onActivate: () => void;
  onMouseEnter?: () => void;
};

/**
 * Indicateur search result row.
 *
 * `contextFields.collectiviteId !== null` tells us the indicateur is
 * personnalisé (scoped to a single collectivité); `null` means it's a
 * referentiel one shared across collectivités.
 */
export function SearchResultRowIndicateur({
  ref,
  hit,
  isSelected,
  onActivate,
  onMouseEnter,
}: SearchResultRowIndicateurProps) {
  const ctx = hit.contextFields ?? {};
  const isPersonnalise =
    ctx['collectiviteId'] !== null && ctx['collectiviteId'] !== undefined;

  return (
    <SearchResultRowShell
      ref={ref}
      isSelected={isSelected}
      onClick={onActivate}
      onMouseEnter={onMouseEnter}
      hitType="indicateur"
      dataTestSuffix={String(hit.id)}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <PrimaryBadge label="Indicateur" />
        {isPersonnalise && <SecondaryBadge label="Personnalisé" />}
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
