import { Injectable, Logger } from '@nestjs/common';
import { DOCUMENT_INDEX } from '@tet/backend/collectivites/documents/document-indexer/document-index.constants';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { INDICATEUR_INDEX } from '@tet/backend/indicateurs/indicateurs/indicateur-indexer/indicateur-index.constants';
import { FICHE_INDEX } from '@tet/backend/plans/fiches/fiche-indexer/fiche-index.constants';
import { PLAN_INDEX } from '@tet/backend/plans/plans/plan-indexer/plan-index.constants';
import { ACTION_INDEX } from '@tet/backend/referentiels/action-indexer/action-index.constants';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import {
  Bucket,
  FicheParentFilter,
  PlanParentFilter,
  SearchHit,
  SearchHitType,
  SearchIndexName,
  SearchRequest,
  SearchResponse,
} from '@tet/domain/search';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { TRPCError } from '@trpc/server';
import type { MultiSearchQuery, MultiSearchResult } from 'meilisearch';

/**
 * Read-side proxy for the global ⌘K search (U7).
 *
 * SECURITY-CRITICAL: this is the *only* enforcement point for multi-tenant
 * isolation on the search path. Meilisearch has no row-level security; if the
 * filter built here is wrong, data leaks across collectivités. Three layers
 * keep the gate tight:
 *
 *   1. The user's permission on `input.collectiviteId` is verified up-front.
 *      For a collectivité with `accesRestreint=true`, the operation requested
 *      is `COLLECTIVITES.READ_CONFIDENTIEL`; otherwise `COLLECTIVITES.READ`.
 *      A user who fails the gate never reaches `multiSearch`.
 *   2. Each per-index query carries a tenant filter built by
 *      {@link buildTenantFilter}. Per-index rules:
 *      - `plans` / `actions` → `collectiviteId = ${id}`
 *      - `fiches` → `visibleCollectiviteIds = ${id}` (sharing-aware)
 *      - `indicateurs` / `documents` → `(collectiviteId IS NULL OR
 *         collectiviteId = ${id})` (predefined / global rows accessible
 *         to everyone)
 *   3. The user-supplied query string is sanitized of control characters
 *      before being forwarded to Meilisearch. Meilisearch treats `q` as
 *      free-text — operators inside `q` are not parsed as filter syntax —
 *      but stripping control bytes is defense in depth against parser bugs.
 *
 * Errors from Meilisearch are wrapped into a stable
 * `INTERNAL_SERVER_ERROR / "Recherche temporairement indisponible"` to avoid
 * leaking internals (master key, code, message) to the client.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly collectivitesService: CollectivitesService,
    private readonly searchIndexer: SearchIndexerService
  ) {}

  async search(user: AuthUser, input: SearchRequest): Promise<SearchResponse> {
    // 1. Strip control chars (defense in depth — Meilisearch ignores `q`
    //    operators but rogue bytes can confuse downstream tracing/logging).
    //    Empty post-strip → return empty buckets without hitting Meilisearch.
    const cleanQuery = input.query.replace(/[\x00-\x1F\x7F]/g, '').trim();
    if (cleanQuery.length === 0) {
      return this.buildEmptyResponse(input.enabledIndexes);
    }

    // 2. Resolve confidentiality and pick the matching read permission op.
    //    If the collectivité doesn't exist, `isPrivate` throws a NotFound
    //    upstream; we let it propagate (returning FORBIDDEN here would leak
    //    "exists vs not" information).
    const isPrivate = await this.collectivitesService.isPrivate(
      input.collectiviteId
    );
    const operation = isPrivate
      ? PermissionOperationEnum['COLLECTIVITES.READ_CONFIDENTIEL']
      : PermissionOperationEnum['COLLECTIVITES.READ'];

    // 3. Per-request gate. `isAllowed` throws ForbiddenException by default;
    //    we convert to TRPCError({ code: 'FORBIDDEN' }) so the error shape
    //    matches the rest of the tRPC surface.
    const allowed = await this.permissionService.isAllowed(
      user,
      operation,
      ResourceType.COLLECTIVITE,
      input.collectiviteId,
      true // doNotThrow — we throw our own TRPCError below
    );
    if (!allowed) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: "Vous n'avez pas les permissions nécessaires",
      });
    }

    // 4. Build the multi-search payload. We only emit a query for indexes the
    //    UI explicitly enabled; that keeps the per-index limits respected and
    //    avoids paying for buckets the user can't see anyway.
    const queries: MultiSearchQuery[] = input.enabledIndexes.map((indexName) =>
      this.buildQuery(
        indexName,
        cleanQuery,
        input.collectiviteId,
        input.ficheParentFilter,
        input.planParentFilter,
        input.limit
      )
    );

    // 5. Fan out to Meilisearch. Any failure is wrapped into a stable
    //    INTERNAL_SERVER_ERROR — we never echo Meilisearch internals.
    let results: MultiSearchResult<Record<string, unknown>>[];
    try {
      const response = await this.searchIndexer.multiSearch<
        Record<string, unknown>
      >({ queries });
      results = response.results;
    } catch (err) {
      this.logger.error(
        `Meilisearch unavailable for collectivité ${input.collectiviteId}`,
        err instanceof Error ? err.stack : String(err)
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Recherche temporairement indisponible',
      });
    }

    // 6. Reshape: per-bucket hits are normalized into `SearchHit` rows whose
    //    `title`/`snippet` carry the `<mark>...</mark>` markup from
    //    `_formatted` when present, and fall back to the raw value otherwise.
    const buckets: SearchResponse['buckets'] = {};
    let totalHits = 0;
    for (let i = 0; i < input.enabledIndexes.length; i++) {
      const indexName = input.enabledIndexes[i];
      const bucketResult = results[i];
      const bucket = this.shapeBucket(indexName, bucketResult);
      buckets[indexName] = bucket;
      totalHits += bucket.estimatedTotalHits;
    }

    return { buckets, totalHits };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private buildEmptyResponse(
    enabledIndexes: SearchIndexName[]
  ): SearchResponse {
    const buckets: SearchResponse['buckets'] = {};
    const empty: Bucket = {
      hits: [],
      estimatedTotalHits: 0,
      processingTimeMs: 0,
    };
    for (const indexName of enabledIndexes) {
      buckets[indexName] = empty;
    }
    return { buckets, totalHits: 0 };
  }

  /**
   * Tenant filter rules — keep these in sync with the indexer side
   * (U3–U6, U12). The proxy is the *only* enforcement point.
   *
   *   - `plans`        → `collectiviteId = ${id}`, optional parent filter
   *                       ('root' / 'axe' / 'all')
   *   - `fiches`       → `visibleCollectiviteIds = ${id}`, optional parent
   *                       filter ('top-level' / 'sous-action' / 'all')
   *   - `indicateurs`  → `(collectiviteId IS NULL OR collectiviteId = ${id})`
   *   - `actions`      → `collectiviteId = ${id}`
   *   - `documents`    → `(collectiviteId IS NULL OR collectiviteId = ${id})`
   */
  private buildTenantFilter(
    indexName: SearchIndexName,
    collectiviteId: number,
    ficheParentFilter: FicheParentFilter,
    planParentFilter: PlanParentFilter
  ): string {
    switch (indexName) {
      case 'plans': {
        const base = `collectiviteId = ${collectiviteId}`;
        if (planParentFilter === 'root') {
          return `${base} AND parent IS NULL`;
        }
        if (planParentFilter === 'axe') {
          return `${base} AND parent IS NOT NULL`;
        }
        return base;
      }
      case 'actions':
        return `collectiviteId = ${collectiviteId}`;
      case 'fiches': {
        const base = `visibleCollectiviteIds = ${collectiviteId}`;
        if (ficheParentFilter === 'top-level') {
          return `${base} AND parentId IS NULL`;
        }
        if (ficheParentFilter === 'sous-action') {
          return `${base} AND parentId IS NOT NULL`;
        }
        return base;
      }
      case 'indicateurs':
      case 'documents':
        return `(collectiviteId IS NULL OR collectiviteId = ${collectiviteId})`;
    }
  }

  private buildQuery(
    indexName: SearchIndexName,
    cleanQuery: string,
    collectiviteId: number,
    ficheParentFilter: FicheParentFilter,
    planParentFilter: PlanParentFilter,
    limit: number
  ): MultiSearchQuery {
    const filter = this.buildTenantFilter(
      indexName,
      collectiviteId,
      ficheParentFilter,
      planParentFilter
    );
    const { highlight, crop } = HIGHLIGHT_CROP_BY_INDEX[indexName];
    return {
      indexUid: indexName,
      q: cleanQuery,
      filter,
      attributesToHighlight: highlight,
      attributesToCrop: crop,
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      limit,
    };
  }

  private shapeBucket(
    indexName: SearchIndexName,
    bucketResult: MultiSearchResult<Record<string, unknown>>
  ): Bucket {
    const hits: SearchHit[] = [];
    for (const rawHit of bucketResult.hits) {
      const formatted = (rawHit as { _formatted?: Record<string, unknown> })
        ._formatted;
      const hit = this.shapeHit(indexName, rawHit, formatted);
      if (hit) {
        hits.push(hit);
      }
    }
    // `estimatedTotalHits` is the InfinitePagination field returned by
    // Meilisearch when neither `page` nor `hitsPerPage` is set. The SDK types
    // mark it optional in the union; we default to `hits.length` as a safe
    // floor when the field is absent (older server versions, edge cases).
    const estimatedTotalHits =
      typeof (bucketResult as { estimatedTotalHits?: number })
        .estimatedTotalHits === 'number'
        ? (bucketResult as { estimatedTotalHits: number }).estimatedTotalHits
        : hits.length;
    return {
      hits,
      estimatedTotalHits,
      processingTimeMs: bucketResult.processingTimeMs ?? 0,
    };
  }

  private shapeHit(
    indexName: SearchIndexName,
    rawHit: Record<string, unknown>,
    formatted: Record<string, unknown> | undefined
  ): SearchHit | null {
    const fmt = formatted ?? rawHit;
    switch (indexName) {
      case 'plans': {
        const id = numberOrNull(rawHit.id);
        const title = stringOrNull(fmt.nom) ?? stringOrNull(rawHit.nom);
        if (id === null || title === null) return null;
        return {
          id,
          type: 'plan' satisfies SearchHitType,
          title,
          snippet: null,
          contextFields: {
            parent: rawHit.parent ?? null,
            // `plan` is the root plan id (sub-axes point to their containing
            // plan; root plans point to themselves). Used by the frontend to
            // route sub-axe clicks to the parent plan URL rather than to the
            // sub-axe's own id, which the plan-action page does not handle.
            plan: rawHit.plan ?? rawHit.id,
            collectiviteId: rawHit.collectiviteId ?? null,
          },
        };
      }
      case 'fiches': {
        const id = numberOrNull(rawHit.id);
        const title = stringOrNull(fmt.titre) ?? stringOrNull(rawHit.titre);
        if (id === null || title === null) return null;
        const snippet =
          stringOrNull(fmt.description) ?? stringOrNull(rawHit.description);
        return {
          id,
          type: 'fiche' satisfies SearchHitType,
          title,
          snippet,
          contextFields: {
            parentId: rawHit.parentId ?? null,
          },
        };
      }
      case 'indicateurs': {
        const id = numberOrNull(rawHit.id);
        const title = stringOrNull(fmt.titre) ?? stringOrNull(rawHit.titre);
        if (id === null || title === null) return null;
        const snippet =
          stringOrNull(fmt.description) ?? stringOrNull(rawHit.description);
        return {
          id,
          type: 'indicateur' satisfies SearchHitType,
          title,
          snippet,
          contextFields: {
            collectiviteId: rawHit.collectiviteId ?? null,
            identifiantReferentiel: rawHit.identifiantReferentiel ?? null,
            titreLong: rawHit.titreLong ?? null,
          },
        };
      }
      case 'actions': {
        // `actions` uses a composite string primary key
        // `${actionId}:${collectiviteId}`.
        const id = stringOrNull(rawHit.id);
        const title = stringOrNull(fmt.nom) ?? stringOrNull(rawHit.nom);
        if (id === null || title === null) return null;
        // Snippet preference: description match first, fall back to
        // commentaire if only the latter contains the highlight.
        const descriptionRaw = stringOrNull(rawHit.description);
        const commentaireRaw = stringOrNull(rawHit.commentaire);
        const descriptionFmt = stringOrNull(fmt.description);
        const commentaireFmt = stringOrNull(fmt.commentaire);
        const descMatched =
          descriptionFmt !== null && descriptionFmt !== descriptionRaw;
        const commentMatched =
          commentaireFmt !== null && commentaireFmt !== commentaireRaw;
        let snippet: string | null;
        if (descMatched) {
          snippet = descriptionFmt;
        } else if (commentMatched) {
          snippet = commentaireFmt;
        } else {
          snippet = descriptionFmt ?? descriptionRaw ?? commentaireFmt ?? null;
        }
        return {
          id,
          type: 'action' satisfies SearchHitType,
          title,
          snippet,
          contextFields: {
            actionId: rawHit.actionId ?? null,
            referentielId: rawHit.referentielId ?? null,
            type: rawHit.type ?? null,
            collectiviteId: rawHit.collectiviteId ?? null,
          },
        };
      }
      case 'documents': {
        const id = numberOrNull(rawHit.id);
        const title =
          stringOrNull(fmt.filename) ?? stringOrNull(rawHit.filename);
        if (id === null || title === null) return null;
        return {
          id,
          type: 'document' satisfies SearchHitType,
          title,
          snippet: null,
          contextFields: {
            collectiviteId: rawHit.collectiviteId ?? null,
          },
        };
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Per-index highlight / crop config (per U7 plan).
// -----------------------------------------------------------------------------

const HIGHLIGHT_CROP_BY_INDEX: Record<
  SearchIndexName,
  { highlight: string[]; crop: string[] }
> = {
  [PLAN_INDEX]: {
    highlight: ['nom'],
    crop: [],
  },
  [FICHE_INDEX]: {
    highlight: ['titre', 'description'],
    crop: ['description:30'],
  },
  [INDICATEUR_INDEX]: {
    highlight: ['identifiantReferentiel', 'titre', 'titreLong', 'description'],
    crop: ['description:30'],
  },
  [ACTION_INDEX]: {
    highlight: ['nom', 'description', 'commentaire'],
    crop: ['description:30', 'commentaire:30'],
  },
  [DOCUMENT_INDEX]: {
    highlight: ['filename'],
    crop: [],
  },
};

// -----------------------------------------------------------------------------
// Type-narrowing helpers.
// -----------------------------------------------------------------------------

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}
