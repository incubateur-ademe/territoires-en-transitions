import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { SearchHit, SearchResponse } from '@tet/domain/search';
import { SearchResultList, flattenSearchResponse } from '../search-result-list';
import { SearchResultRowAction } from '../search-result-row-action';
import { SearchResultRowDocument } from '../search-result-row-document';
import { SearchResultRowFiche } from '../search-result-row-fiche';
import { SearchResultRowIndicateur } from '../search-result-row-indicateur';
import { SearchResultRowPlan } from '../search-result-row-plan';
import { sanitizeHighlightHtml } from '../highlighted-text';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const noop = () => undefined;

function makeHit(overrides: Partial<SearchHit> & { type: SearchHit['type'] }): SearchHit {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Titre',
    snippet: overrides.snippet ?? null,
    type: overrides.type,
    contextFields: overrides.contextFields ?? {},
  };
}

/**
 * Builds a `SearchResponse` from one hit per entity type so we can drive the
 * list shell + keyboard nav tests against a realistic flatten order.
 */
function makeResponse(hits: SearchHit[]): SearchResponse {
  const buckets: SearchResponse['buckets'] = {};
  const byType: Record<string, SearchHit[]> = {};
  for (const h of hits) {
    const key = h.type === 'plan'
      ? 'plans'
      : h.type === 'fiche'
      ? 'fiches'
      : h.type === 'indicateur'
      ? 'indicateurs'
      : h.type === 'action'
      ? 'actions'
      : 'documents';
    byType[key] ??= [];
    byType[key].push(h);
  }
  for (const [k, v] of Object.entries(byType)) {
    (buckets as Record<string, unknown>)[k] = {
      hits: v,
      estimatedTotalHits: v.length,
      processingTimeMs: 1,
    };
  }
  return { buckets, totalHits: hits.length };
}

/**
 * Test driver that wires the same keyboard navigation as `search-modal.tsx`
 * around `SearchResultList`. Lets us exercise ↑/↓/Enter without depending on
 * the full modal shell or any portal/floating-ui plumbing.
 */
function ListDriver({
  response,
  onActivate,
}: {
  response: SearchResponse;
  onActivate: (hit: SearchHit) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { flatHits } = flattenSearchResponse(response);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (flatHits.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) =>
        current >= flatHits.length - 1 ? current : current + 1
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => (current <= 0 ? 0 : current - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const hit = flatHits[selectedIndex];
      if (hit) onActivate(hit);
    }
  };

  return (
    <div data-testid="driver" tabIndex={-1} onKeyDown={onKeyDown}>
      <SearchResultList
        response={response}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={setSelectedIndex}
        onActivate={onActivate}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Per-entity row badges
// -----------------------------------------------------------------------------

describe('per-entity result rows — badges and labels', () => {
  it('plan row with parent null shows the "Plan" badge', () => {
    const hit = makeHit({
      type: 'plan',
      title: 'Plan climat 2030',
      contextFields: { parent: null },
    });
    render(
      <ul>
        <SearchResultRowPlan hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.queryByText('Axe')).not.toBeInTheDocument();
  });

  it('plan row with parent set shows the "Axe" badge', () => {
    const hit = makeHit({
      type: 'plan',
      title: 'Axe 1.1 - Mobilité',
      contextFields: { parent: 1 },
    });
    render(
      <ul>
        <SearchResultRowPlan hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    expect(screen.getByText('Axe')).toBeInTheDocument();
    expect(screen.queryByText('Plan')).not.toBeInTheDocument();
  });

  it('fiche row with parentId null shows the "Action" badge', () => {
    const hit = makeHit({
      type: 'fiche',
      title: 'Plan vélo',
      contextFields: { parentId: null },
    });
    render(
      <ul>
        <SearchResultRowFiche hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.queryByText('Sous-action')).not.toBeInTheDocument();
  });

  it('fiche row with parentId set shows the "Sous-action" badge', () => {
    const hit = makeHit({
      type: 'fiche',
      title: 'Étape 2',
      contextFields: { parentId: 42 },
    });
    render(
      <ul>
        <SearchResultRowFiche hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    expect(screen.getByText('Sous-action')).toBeInTheDocument();
    // No "Action" primary badge — only the Sous-action one.
    expect(screen.queryByText('Action')).not.toBeInTheDocument();
  });

  it('indicateur row with collectiviteId !== null shows the "Personnalisé" tag', () => {
    const hit = makeHit({
      type: 'indicateur',
      title: 'CO2 émis',
      contextFields: { collectiviteId: 7, identifiantReferentiel: null },
    });
    render(
      <ul>
        <SearchResultRowIndicateur
          hit={hit}
          isSelected={false}
          onActivate={noop}
        />
      </ul>
    );
    expect(screen.getByText('Indicateur')).toBeInTheDocument();
    expect(screen.getByText('Personnalisé')).toBeInTheDocument();
  });

  it('indicateur row with collectiviteId === null does NOT show the "Personnalisé" tag', () => {
    const hit = makeHit({
      type: 'indicateur',
      title: 'CO2 émis',
      contextFields: {
        collectiviteId: null,
        identifiantReferentiel: 'cae_1.1',
      },
    });
    render(
      <ul>
        <SearchResultRowIndicateur
          hit={hit}
          isSelected={false}
          onActivate={noop}
        />
      </ul>
    );
    expect(screen.getByText('Indicateur')).toBeInTheDocument();
    expect(screen.queryByText('Personnalisé')).not.toBeInTheDocument();
  });

  it('document row shows the highlighted filename and the "Document" badge', () => {
    const hit = makeHit({
      type: 'document',
      title: 'rapport <mark>carbone</mark>.pdf',
      contextFields: { collectiviteId: 1 },
    });
    render(
      <ul>
        <SearchResultRowDocument
          hit={hit}
          isSelected={false}
          onActivate={noop}
        />
      </ul>
    );
    expect(screen.getByText('Document')).toBeInTheDocument();
    // <mark>carbone</mark> survives sanitization.
    const marks = document.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe('carbone');
  });

  it('action row with type "sous-action" renders the "Mesure · Sous-action" badge pair', () => {
    const hit = makeHit({
      type: 'action',
      id: 'cae_1.1.1:42',
      title: 'Mettre en place une stratégie',
      contextFields: {
        actionId: 'cae_1.1.1',
        type: 'sous-action',
        referentielId: 'cae',
      },
    });
    render(
      <ul>
        <SearchResultRowAction hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    expect(screen.getByText('Mesure')).toBeInTheDocument();
    expect(screen.getByText('Mesure · Sous-action')).toBeInTheDocument();
  });

  it('action row with type "tache" renders the "Mesure · Tâche" badge pair', () => {
    const hit = makeHit({
      type: 'action',
      id: 'cae_1.1.1.a:42',
      title: 'Tâche A',
      contextFields: {
        actionId: 'cae_1.1.1.a',
        type: 'tache',
        referentielId: 'cae',
      },
    });
    render(
      <ul>
        <SearchResultRowAction hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    expect(screen.getByText('Mesure · Tâche')).toBeInTheDocument();
  });
});

// -----------------------------------------------------------------------------
// flattenSearchResponse — bucket splits
// -----------------------------------------------------------------------------

describe('flattenSearchResponse — plan / axe partition', () => {
  it('partitions the plans bucket into "Plans" (root) and "Axes" (sub) sections', () => {
    const root = makeHit({
      id: 1,
      type: 'plan',
      title: 'Plan climat',
      contextFields: { parent: null },
    });
    const axe = makeHit({
      id: 2,
      type: 'plan',
      title: 'Axe 1.1',
      contextFields: { parent: 1 },
    });
    const response = makeResponse([root, axe]);
    const { sections } = flattenSearchResponse(response);
    const labels = sections.map((s) => s.label);
    expect(labels).toEqual(['Plans', 'Axes']);
    expect(sections[0].hits).toEqual([root]);
    expect(sections[1].hits).toEqual([axe]);
  });

  it('emits only "Plans" when no sub-axes are present', () => {
    const root = makeHit({
      id: 1,
      type: 'plan',
      title: 'Plan',
      contextFields: { parent: null },
    });
    const response = makeResponse([root]);
    const { sections } = flattenSearchResponse(response);
    const labels = sections.map((s) => s.label);
    expect(labels).toEqual(['Plans']);
  });

  it('emits only "Axes" when no root plans are present', () => {
    const axe = makeHit({
      id: 2,
      type: 'plan',
      title: 'Axe seul',
      contextFields: { parent: 99 },
    });
    const response = makeResponse([axe]);
    const { sections } = flattenSearchResponse(response);
    const labels = sections.map((s) => s.label);
    expect(labels).toEqual(['Axes']);
  });
});

// -----------------------------------------------------------------------------
// Highlight rendering — happy path
// -----------------------------------------------------------------------------

describe('highlight rendering', () => {
  it('renders <mark> tokens inside the title HTML', () => {
    const hit = makeHit({
      type: 'fiche',
      title: 'Plan <mark>carbone</mark> 2030',
      contextFields: { parentId: null },
    });
    render(
      <ul>
        <SearchResultRowFiche hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    const marks = document.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe('carbone');
  });

  it('renders <mark> tokens inside the snippet HTML', () => {
    const hit = makeHit({
      type: 'fiche',
      title: 'Titre',
      snippet: 'Description avec <mark>match</mark> au milieu',
      contextFields: { parentId: null },
    });
    render(
      <ul>
        <SearchResultRowFiche hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThanOrEqual(1);
    expect(Array.from(marks).some((m) => m.textContent === 'match')).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// XSS / sanitization
// -----------------------------------------------------------------------------

describe('XSS — DOMPurify allowlist', () => {
  it('strips <script> tags from highlighted titles', () => {
    const hit = makeHit({
      type: 'fiche',
      title: 'Plan<script>alert(1)</script><mark>OK</mark>',
      contextFields: { parentId: null },
    });
    render(
      <ul>
        <SearchResultRowFiche hit={hit} isSelected={false} onActivate={noop} />
      </ul>
    );
    expect(document.querySelector('script')).toBeNull();
    // <mark> still renders for the legitimate highlight.
    const marks = document.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe('OK');
  });

  it('strips <img onerror=...> from highlighted titles', () => {
    const hit = makeHit({
      type: 'document',
      title:
        '<img src=x onerror="alert(1)" />badfile<mark>.pdf</mark>',
      contextFields: { collectiviteId: 1 },
    });
    render(
      <ul>
        <SearchResultRowDocument
          hit={hit}
          isSelected={false}
          onActivate={noop}
        />
      </ul>
    );
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('script')).toBeNull();
  });

  it('sanitizeHighlightHtml drops every tag except <mark>', () => {
    const dirty =
      '<script>alert(1)</script><a href="evil">x</a><svg/onload=alert(1)><mark>kept</mark>';
    const clean = sanitizeHighlightHtml(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('<a');
    expect(clean).not.toContain('<svg');
    expect(clean).toContain('<mark>kept</mark>');
  });

  it('drops attributes on <mark> (allowlist has zero attrs)', () => {
    const dirty = '<mark onclick="alert(1)" id="x">hi</mark>';
    const clean = sanitizeHighlightHtml(dirty);
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('id=');
    expect(clean).toContain('<mark>hi</mark>');
  });
});

// -----------------------------------------------------------------------------
// Keyboard navigation + click — through the list shell driver
// -----------------------------------------------------------------------------

describe('SearchResultList — keyboard nav and click', () => {
  const planHit = makeHit({ type: 'plan', id: 1, title: 'Plan 1' });
  const ficheHit = makeHit({
    type: 'fiche',
    id: 11,
    title: 'Fiche 1',
    contextFields: { parentId: null },
  });
  const indHit = makeHit({
    type: 'indicateur',
    id: 21,
    title: 'Indic 1',
    contextFields: { collectiviteId: null, identifiantReferentiel: null },
  });
  const response = makeResponse([planHit, ficheHit, indHit]);

  it('ArrowDown moves selection forward; ArrowUp moves it back; Enter activates the selected hit', () => {
    const onActivate = vi.fn();
    render(<ListDriver response={response} onActivate={onActivate} />);
    const driver = screen.getByTestId('driver');

    // Start: index 0 = planHit. Move down twice → indHit.
    fireEvent.keyDown(driver, { key: 'ArrowDown' });
    fireEvent.keyDown(driver, { key: 'ArrowDown' });
    fireEvent.keyDown(driver, { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenLastCalledWith(indHit);

    // Move back up to ficheHit and Enter.
    fireEvent.keyDown(driver, { key: 'ArrowUp' });
    fireEvent.keyDown(driver, { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onActivate).toHaveBeenLastCalledWith(ficheHit);
  });

  it('ArrowUp at the top is a no-op (stops without wrap)', () => {
    const onActivate = vi.fn();
    render(<ListDriver response={response} onActivate={onActivate} />);
    const driver = screen.getByTestId('driver');

    // Already at index 0; ArrowUp should not wrap. Enter still activates planHit.
    fireEvent.keyDown(driver, { key: 'ArrowUp' });
    fireEvent.keyDown(driver, { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenLastCalledWith(planHit);
  });

  it('ArrowDown at the bottom is a no-op (stops without wrap)', () => {
    const onActivate = vi.fn();
    render(<ListDriver response={response} onActivate={onActivate} />);
    const driver = screen.getByTestId('driver');

    // Move past the last index; selection should clamp at indHit.
    fireEvent.keyDown(driver, { key: 'ArrowDown' });
    fireEvent.keyDown(driver, { key: 'ArrowDown' });
    fireEvent.keyDown(driver, { key: 'ArrowDown' });
    fireEvent.keyDown(driver, { key: 'ArrowDown' });
    fireEvent.keyDown(driver, { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenLastCalledWith(indHit);
  });

  it('clicking a row activates that exact row (not whatever the keyboard cursor points at)', () => {
    const onActivate = vi.fn();
    render(<ListDriver response={response} onActivate={onActivate} />);
    const driver = screen.getByTestId('driver');

    // Cursor on planHit (index 0). Click on the indicateur row directly.
    const list = within(driver);
    const indRow = list.getByText('Indic 1').closest('li');
    expect(indRow).not.toBeNull();
    fireEvent.click(indRow!);
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenLastCalledWith(indHit);
  });
});
