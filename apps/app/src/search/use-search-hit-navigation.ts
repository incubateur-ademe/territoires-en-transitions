'use client';

import { SearchHit } from '@tet/domain/search';
import type { ReferentielId } from '@tet/domain/referentiels';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import {
  collectiviteBibliothequePath,
  makeCollectiviteActionUrl,
  makeCollectiviteIndicateursUrl,
  makeCollectivitePlanActionUrl,
  makeReferentielActionUrl,
} from '@/app/app/paths';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';

/**
 * Builds the deep-link URL for a single hit. Returns `null` when navigation is
 * not applicable for this entity (e.g. documents in v1 — they have no detail
 * page, so the row activates as a no-op).
 *
 * Defensive on `contextFields`: any field may be missing, the schema is
 * `Record<string, unknown>` and the U7 indexer fills it best-effort.
 */
export function getSearchHitUrl(
  hit: SearchHit,
  collectiviteId: number
): string | null {
  const ctx = hit.contextFields ?? {};

  switch (hit.type) {
    case 'plan': {
      // For root plans, `contextFields.plan` equals `hit.id`; for sub-axes
      // it points to the *containing* plan id (set at index time from
      // `axe.plan ?? axe.id`). The plan-action page only renders if the URL's
      // `planActionUid` is a root plan id, so falling back to `hit.id` for a
      // sub-axe would break navigation.
      const planRaw = ctx['plan'];
      const planActionUid =
        typeof planRaw === 'number'
          ? String(planRaw)
          : String(hit.id);
      return makeCollectivitePlanActionUrl({
        collectiviteId,
        planActionUid,
      });
    }
    case 'fiche': {
      const ficheUid = String(hit.id);
      return makeCollectiviteActionUrl({
        collectiviteId,
        ficheUid,
      });
    }
    case 'indicateur': {
      // `identifiantReferentiel` is in contextFields when the indicateur is a
      // referentiel one (ex. `cae_1.1`). `getIndicateurGroup` falls back to
      // 'perso' when null/undefined, which matches the personnalisé route
      // segment.
      const identifiant =
        typeof ctx['identifiantReferentiel'] === 'string'
          ? (ctx['identifiantReferentiel'] as string)
          : null;
      const indicateurId =
        typeof hit.id === 'number'
          ? hit.id
          : Number.isFinite(Number(hit.id))
          ? Number(hit.id)
          : undefined;
      return makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: getIndicateurGroup(identifiant),
        indicateurId,
        identifiantReferentiel: identifiant,
      });
    }
    case 'action': {
      const actionId =
        typeof ctx['actionId'] === 'string'
          ? (ctx['actionId'] as string)
          : null;
      const referentielId =
        typeof ctx['referentielId'] === 'string'
          ? (ctx['referentielId'] as ReferentielId)
          : null;
      if (!actionId || !referentielId) return null;
      return makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId,
      });
    }
    case 'document': {
      // v1: documents have no dedicated detail page. We send the user to the
      // collectivité bibliothèque so they can locate the file there. If
      // future iterations add a per-file route, swap this in here.
      return collectiviteBibliothequePath.replace(
        ':collectiviteId',
        collectiviteId.toString()
      );
    }
    default:
      return null;
  }
}

/**
 * Returns a stable callback that navigates to the entity's detail page (or the
 * collectivité bibliothèque for documents) and triggers `onClose` so the modal
 * dismisses on activation.
 */
export function useSearchHitNavigation({
  collectiviteId,
  onClose,
}: {
  collectiviteId: number | null;
  onClose: () => void;
}): (hit: SearchHit) => void {
  const router = useRouter();
  return useCallback(
    (hit: SearchHit) => {
      if (collectiviteId === null) {
        onClose();
        return;
      }
      const url = getSearchHitUrl(hit, collectiviteId);
      if (url) {
        router.push(url);
      }
      onClose();
    },
    [router, collectiviteId, onClose]
  );
}
