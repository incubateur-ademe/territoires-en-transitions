'use client';

import { SearchHit } from '@tet/domain/search';
import { ActionType } from '@tet/domain/referentiels';
import { HighlightedText } from './highlighted-text';
import {
  HIGHLIGHT_SNIPPET_CLASSES,
  HIGHLIGHT_TITLE_CLASSES,
  PrimaryBadge,
  SearchResultRowShell,
  SecondaryBadge,
} from './search-result-row-shell';

export type SearchResultRowActionProps = {
  ref?: React.Ref<HTMLLIElement>;
  hit: SearchHit;
  isSelected: boolean;
  onActivate: () => void;
  onMouseEnter?: () => void;
};

/**
 * Maps a referentiel `ActionType` to the user-facing French label rendered in
 * the sub-badge. Only the tiers actually emitted by the actions index appear
 * here ("axe" / "sous-axe" / "referentiel" never reach the search results).
 */
const ACTION_TYPE_LABEL: Partial<Record<ActionType, string>> = {
  action: 'Action',
  'sous-action': 'Sous-action',
  tache: 'Tâche',
  exemple: 'Exemple',
  axe: 'Axe',
  'sous-axe': 'Sous-axe',
  referentiel: 'Référentiel',
};

/**
 * Action (mesure) search result row.
 *
 * U7 stores the referentiel hierarchy tier in `contextFields.type` and the
 * original action id (e.g. `cae_1.1`) in `contextFields.actionId`. Both feed
 * the badge pair shown beside the title.
 */
export function SearchResultRowAction({
  ref,
  hit,
  isSelected,
  onActivate,
  onMouseEnter,
}: SearchResultRowActionProps) {
  const ctx = hit.contextFields ?? {};
  const tier = typeof ctx['type'] === 'string' ? (ctx['type'] as string) : null;
  const subBadge =
    tier && ACTION_TYPE_LABEL[tier as ActionType]
      ? `Mesure · ${ACTION_TYPE_LABEL[tier as ActionType]}`
      : null;
  const actionId =
    typeof ctx['actionId'] === 'string' ? (ctx['actionId'] as string) : null;
  const referentielId =
    typeof ctx['referentielId'] === 'string'
      ? (ctx['referentielId'] as string)
      : null;

  return (
    <SearchResultRowShell
      ref={ref}
      isSelected={isSelected}
      onClick={onActivate}
      onMouseEnter={onMouseEnter}
      hitType="action"
      dataTestSuffix={String(hit.id)}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <PrimaryBadge label="Mesure" />
        {subBadge && <SecondaryBadge label={subBadge} />}
        <HighlightedText html={hit.title} className={HIGHLIGHT_TITLE_CLASSES} />
      </div>
      {(actionId || referentielId) && (
        <p className="mb-0 text-xs text-grey-7 uppercase tracking-wide">
          {[referentielId, actionId].filter(Boolean).join(' · ')}
        </p>
      )}
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
