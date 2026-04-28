'use client';

import {
  Bucket,
  SearchHit,
  SearchHitType,
  SearchResponse,
} from '@tet/domain/search';
import { useEffect, useMemo, useRef } from 'react';
import { SearchResultRowAction } from './search-result-row-action';
import { SearchResultRowDocument } from './search-result-row-document';
import { SearchResultRowFiche } from './search-result-row-fiche';
import { SearchResultRowIndicateur } from './search-result-row-indicateur';
import { SearchResultRowPlan } from './search-result-row-plan';

/**
 * Stable display order of buckets in the result list.
 *
 * The `plans` bucket is rendered as two visual sections — root Plans and
 * sub-Axes — based on `parent` in `contextFields`. The `fiches` bucket is
 * similarly split into top-level Actions and Sous-actions. Both splits are
 * cosmetic; each pair comes from a single backend bucket.
 */
type BucketSlot =
  | 'plans:root'
  | 'plans:axe'
  | 'fiches:top-level'
  | 'fiches:sous-action'
  | 'indicateurs'
  | 'actions'
  | 'documents';

const BUCKET_ORDER: BucketSlot[] = [
  'plans:root',
  'plans:axe',
  'fiches:top-level',
  'fiches:sous-action',
  'indicateurs',
  'actions',
  'documents',
];

const BUCKET_LABEL: Record<BucketSlot, string> = {
  'plans:root': 'Plans',
  'plans:axe': 'Axes',
  'fiches:top-level': 'Actions',
  'fiches:sous-action': 'Sous-actions',
  indicateurs: 'Indicateurs',
  actions: 'Mesures',
  documents: 'Documents',
};

export type SearchResultListProps = {
  response: SearchResponse | undefined;
  /** Currently highlighted hit index in the flattened list. */
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  /** Called when a hit is activated (Enter or click). */
  onActivate: (hit: SearchHit) => void;
};

/**
 * Flattens response buckets into a single ordered list while keeping per-bucket
 * section breaks. Used both for rendering and for keyboard navigation index.
 */
export function flattenSearchResponse(
  response: SearchResponse | undefined
): {
  sections: Array<{
    slot: BucketSlot;
    label: string;
    hits: SearchHit[];
    /** Index in the flat list at which this section's first hit sits. */
    startIndex: number;
  }>;
  flatHits: SearchHit[];
} {
  if (!response) {
    return { sections: [], flatHits: [] };
  }

  const buckets = response.buckets;
  const flatHits: SearchHit[] = [];
  const sections: ReturnType<typeof flattenSearchResponse>['sections'] = [];

  for (const slot of BUCKET_ORDER) {
    let bucket: Bucket | undefined;
    let hits: SearchHit[] = [];

    if (slot === 'plans:root' || slot === 'plans:axe') {
      bucket = buckets.plans;
      if (!bucket) continue;
      const wantRoot = slot === 'plans:root';
      hits = bucket.hits.filter((h) => {
        const parent = h.contextFields?.['parent'];
        const isRoot = parent === null || parent === undefined;
        return wantRoot ? isRoot : !isRoot;
      });
    } else if (slot === 'fiches:top-level' || slot === 'fiches:sous-action') {
      bucket = buckets.fiches;
      if (!bucket) continue;
      const wantTopLevel = slot === 'fiches:top-level';
      hits = bucket.hits.filter((h) => {
        const parentId = h.contextFields?.['parentId'];
        const isTopLevel = parentId === null || parentId === undefined;
        return wantTopLevel ? isTopLevel : !isTopLevel;
      });
    } else {
      bucket = buckets[slot];
      if (!bucket) continue;
      hits = bucket.hits;
    }

    if (hits.length === 0) continue;

    sections.push({
      slot,
      label: BUCKET_LABEL[slot],
      hits,
      startIndex: flatHits.length,
    });
    flatHits.push(...hits);
  }

  return { sections, flatHits };
}

/**
 * Per-entity row component lookup. Stable references — defined at module
 * scope so React doesn't re-render rows when the list shell re-renders.
 */
const ROW_BY_TYPE: Record<
  SearchHitType,
  React.ComponentType<{
    ref?: React.Ref<HTMLLIElement>;
    hit: SearchHit;
    isSelected: boolean;
    onActivate: () => void;
    onMouseEnter?: () => void;
  }>
> = {
  plan: SearchResultRowPlan,
  fiche: SearchResultRowFiche,
  indicateur: SearchResultRowIndicateur,
  action: SearchResultRowAction,
  document: SearchResultRowDocument,
};

export function SearchResultList({
  response,
  selectedIndex,
  onSelectedIndexChange,
  onActivate,
}: SearchResultListProps) {
  const { sections, flatHits } = useMemo(
    () => flattenSearchResponse(response),
    [response]
  );

  const selectedRowRef = useRef<HTMLLIElement | null>(null);

  // Scroll the selected row into view as keyboard navigation moves through
  // the list.
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (flatHits.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <div key={section.slot} className="flex flex-col gap-1">
          <h4 className="mb-0 text-sm font-bold uppercase tracking-wide text-grey-7">
            {section.label} ({section.hits.length})
          </h4>
          <ul className="flex flex-col" role="listbox">
            {section.hits.map((hit, idxInSection) => {
              const flatIndex = section.startIndex + idxInSection;
              const isSelected = flatIndex === selectedIndex;
              const Row = ROW_BY_TYPE[hit.type];
              if (!Row) return null;
              return (
                <Row
                  key={`${hit.type}-${String(hit.id)}`}
                  ref={isSelected ? selectedRowRef : undefined}
                  hit={hit}
                  isSelected={isSelected}
                  onActivate={() => onActivate(hit)}
                  onMouseEnter={() => onSelectedIndexChange(flatIndex)}
                />
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
