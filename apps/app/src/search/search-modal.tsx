'use client';

import { Button, Input, Modal } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useCollectiviteContext } from '@tet/api/collectivites';
import {
  FicheParentFilter,
  PlanParentFilter,
  SearchIndexName,
} from '@tet/domain/search';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Kbd } from '@/app/ui/shared/Kbd';
import { useGlobalSearchShortcut } from './use-global-search-shortcut';
import { useSearchQuery } from './use-search-query';
import {
  SearchResultList,
  flattenSearchResponse,
} from './search-result-list';
import { useSearchHitNavigation } from './use-search-hit-navigation';

/**
 * Chip definitions in the order they appear under the input. "Indicateurs" /
 * "Mesures" / "Documents" map 1:1 to backend index names. "Plans" and "Axes"
 * both filter the `plans` index (compose `planParentFilter`); "Actions" and
 * "Sous-actions" both filter the `fiches` index (compose `ficheParentFilter`).
 */
type ChipKey =
  | 'plans'
  | 'axes'
  | 'actions'
  | 'sous-actions'
  | 'indicateurs'
  | 'mesures'
  | 'documents';

const CHIPS: Array<{ key: ChipKey; label: string }> = [
  { key: 'plans', label: 'Plans' },
  { key: 'axes', label: 'Axes' },
  { key: 'actions', label: 'Actions' },
  { key: 'sous-actions', label: 'Sous-actions' },
  { key: 'indicateurs', label: 'Indicateurs' },
  { key: 'mesures', label: 'Mesures' },
  { key: 'documents', label: 'Documents' },
];

const ALL_CHIPS_ENABLED: Record<ChipKey, boolean> = {
  plans: true,
  axes: true,
  actions: true,
  'sous-actions': true,
  indicateurs: true,
  mesures: true,
  documents: true,
};

/**
 * Derives the backend `enabledIndexes` array, `planParentFilter`, and
 * `ficheParentFilter` from the chip toggle state. The `plans` index is enabled
 * when either the Plans or Axes chip is on; the `fiches` index when either
 * Actions or Sous-actions is on.
 */
function chipsToBackendInput(chips: Record<ChipKey, boolean>): {
  enabledIndexes: SearchIndexName[];
  ficheParentFilter: FicheParentFilter;
  planParentFilter: PlanParentFilter;
} {
  const enabledIndexes: SearchIndexName[] = [];
  if (chips.plans || chips.axes) enabledIndexes.push('plans');
  if (chips.actions || chips['sous-actions']) enabledIndexes.push('fiches');
  if (chips.indicateurs) enabledIndexes.push('indicateurs');
  if (chips.mesures) enabledIndexes.push('actions');
  if (chips.documents) enabledIndexes.push('documents');

  let ficheParentFilter: FicheParentFilter = 'all';
  if (chips.actions && !chips['sous-actions']) {
    ficheParentFilter = 'top-level';
  } else if (!chips.actions && chips['sous-actions']) {
    ficheParentFilter = 'sous-action';
  }

  let planParentFilter: PlanParentFilter = 'all';
  if (chips.plans && !chips.axes) {
    planParentFilter = 'root';
  } else if (!chips.plans && chips.axes) {
    planParentFilter = 'axe';
  }

  return { enabledIndexes, ficheParentFilter, planParentFilter };
}

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chips, setChips] =
    useState<Record<ChipKey, boolean>>(ALL_CHIPS_ENABLED);
  const [exclusiveMode, setExclusiveMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Read collectivité reactively. Must NOT crash when null/undefined — fall
  // back to a placeholder UI inside the modal.
  const collectiviteContext = useCollectiviteContext();
  const collectiviteId = collectiviteContext.collectiviteId ?? null;

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  // Global ⌘K / Ctrl+K — toggles open/close (closes if already open).
  useGlobalSearchShortcut(toggle);

  // Reset transient state on open: empty query, default chips, default mode.
  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // When the active collectivité changes mid-open, blank the query so the
  // result list clears and a fresh search is keyed on the new id.
  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectiviteId]);

  const { enabledIndexes, ficheParentFilter, planParentFilter } = useMemo(
    () => chipsToBackendInput(chips),
    [chips]
  );

  const {
    data,
    isFetching,
    error,
    refetch,
    enabled: queryEnabled,
    debouncedQuery,
  } = useSearchQuery({
    query,
    collectiviteId,
    enabledIndexes,
    exclusiveMode,
    ficheParentFilter,
    planParentFilter,
  });

  const totalHits = data?.totalHits ?? 0;
  const hasQuery = debouncedQuery.length > 0;

  // Keep a flat list of hits for keyboard navigation. The flattening matches
  // the order rendered by SearchResultList exactly.
  const flatHits = useMemo(
    () => flattenSearchResponse(data).flatHits,
    [data]
  );

  // Reset cursor whenever the underlying result identity changes (new
  // collectivité, new debounced query, or shrinking list).
  useEffect(() => {
    setSelectedIndex(0);
  }, [collectiviteId, debouncedQuery]);

  useEffect(() => {
    if (selectedIndex > Math.max(0, flatHits.length - 1)) {
      setSelectedIndex(0);
    }
  }, [flatHits.length, selectedIndex]);

  const handleChipClick = (key: ChipKey) => {
    setChips((current) => {
      if (exclusiveMode) {
        // Mode exclusif: clicking a chip enables only that one.
        const next: Record<ChipKey, boolean> = {
          plans: false,
          axes: false,
          actions: false,
          'sous-actions': false,
          indicateurs: false,
          mesures: false,
          documents: false,
        };
        next[key] = true;
        return next;
      }
      return { ...current, [key]: !current[key] };
    });
  };

  // Real navigation: pushes the entity's detail URL via the App Router and
  // dismisses the modal. Documents have no detail page in v1 — the navigation
  // helper falls back to the collectivité bibliothèque so the user can still
  // reach the file.
  const handleActivate = useSearchHitNavigation({
    collectiviteId,
    onClose: close,
  });

  const handleContentKeyDown = (event: React.KeyboardEvent) => {
    if (flatHits.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) =>
        // No wrap: stop at the bottom.
        current >= flatHits.length - 1 ? current : current + 1
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      // No wrap: stop at the top.
      setSelectedIndex((current) => (current <= 0 ? 0 : current - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const hit = flatHits[selectedIndex];
      if (hit) {
        handleActivate(hit);
      }
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      size="lg"
      noCloseButton
      dataTest="GlobalSearchModal"
      render={() => (
        <div
          className="flex flex-col gap-4 -my-2"
          onKeyDown={handleContentKeyDown}
        >
          {/* Input — plain text input (we own debouncing in useSearchQuery,
              so we don't use the InputSearch variant which has its own
              debounce). */}
          <Input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher dans vos plans, actions, indicateurs et mesures…"
            // FloatingFocusManager focuses the first focusable element on
            // open, which is this input — no manual autoFocus needed. We
            // add it as a safety net.
            autoFocus
            icon={{ value: 'search-line' }}
            data-test="GlobalSearchInput"
          />

          {/* Chips + exclusive mode toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {CHIPS.map((chip) => {
              const isEnabled = chips[chip.key];
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleChipClick(chip.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-colors',
                    isEnabled
                      ? 'bg-primary-1 border-primary-5 text-primary-9'
                      : 'bg-white border-grey-4 text-grey-7'
                  )}
                  aria-pressed={isEnabled}
                  data-test={`SearchChip-${chip.key}`}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'inline-block w-3 h-3 rounded-full',
                      isEnabled ? 'bg-primary-7' : 'bg-grey-4'
                    )}
                  />
                  {chip.label}
                </button>
              );
            })}
            <label className="ml-auto flex items-center gap-2 text-sm text-grey-8 cursor-pointer">
              <input
                type="checkbox"
                checked={exclusiveMode}
                onChange={(event) => setExclusiveMode(event.target.checked)}
                data-test="SearchExclusiveMode"
              />
              Mode exclusif
            </label>
          </div>

          {/* Results region */}
          <div
            className={cn(
              'min-h-[12rem] max-h-[55vh] overflow-y-auto pr-1 relative',
              isFetching && 'opacity-90'
            )}
            aria-busy={isFetching}
            aria-live="polite"
          >
            {/* Subtle spinner overlay during fetch — keeps prior results
                visible underneath to avoid flicker on each keystroke. */}
            {isFetching && (
              <div className="absolute right-0 top-0 z-10">
                <span
                  aria-label="Recherche en cours"
                  className="inline-block w-4 h-4 border-2 border-primary-7 border-t-transparent rounded-full animate-spin"
                />
              </div>
            )}

            {!collectiviteId ? (
              <p className="text-sm text-grey-8 mt-6 text-center">
                Sélectionnez une collectivité pour effectuer une recherche.
              </p>
            ) : error ? (
              <ErrorState onRetry={() => refetch()} />
            ) : !hasQuery || !queryEnabled ? (
              <EmptyState />
            ) : totalHits === 0 && !isFetching ? (
              <NoResultState />
            ) : (
              <SearchResultList
                response={data}
                selectedIndex={selectedIndex}
                onSelectedIndexChange={setSelectedIndex}
                onActivate={handleActivate}
              />
            )}
          </div>
        </div>
      )}
      renderFooter={() => (
        <div className="flex items-center justify-end gap-3 text-xs text-grey-8 pt-2 border-t border-grey-3">
          <span>
            <Kbd>↓</Kbd> <Kbd>↑</Kbd> pour naviguer
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <Kbd>↵</Kbd> pour ouvrir
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <Kbd>ESC</Kbd> pour fermer
          </span>
        </div>
      )}
    />
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-grey-8 mt-6 text-center">
      Tapez pour rechercher dans vos plans, actions, indicateurs et mesures.
    </p>
  );
}

function NoResultState() {
  return (
    <p className="text-sm text-grey-8 mt-6 text-center">Aucun résultat.</p>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      <p className="text-sm text-error-1 mb-0">
        Recherche temporairement indisponible.
      </p>
      <Button size="xs" variant="outlined" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}
