import { appLabels } from '@/app/labels/catalog';
import type { RouterInput } from '@tet/api';
import {
  Etoile,
  ReferentielId,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { z } from 'zod';

export const REQUESTABLE_AUDIT_STARS = [2, 3, 4, 5] as const;
export type RequestableAuditStar = (typeof REQUESTABLE_AUDIT_STARS)[number];
export const MINIMUM_REQUESTABLE_AUDIT_STAR: RequestableAuditStar =
  REQUESTABLE_AUDIT_STARS[0];

/**
 * Étoile présélectionnée par défaut : l'étoile-objectif atteignable selon le
 * score, ou `null` si la collectivité ne peut viser aucune étoile auditable.
 */
export const defaultRequestableStar = (
  maximumPossibleStarToRequest: Etoile
): RequestableAuditStar | null =>
  REQUESTABLE_AUDIT_STARS.find(
    (star) => star === maximumPossibleStarToRequest
  ) ?? null;

const requestableAuditStarSchema = z.literal(REQUESTABLE_AUDIT_STARS);

/**
 * Entrée : le brouillon saisi dans le formulaire (sujet/étoile encore
 * optionnels). Sortie : la sélection complète et narrowée — la validation et le
 * narrowing sont faits une seule fois, ici, par le resolver du formulaire.
 */
export const auditSelectionSchema = z
  .object({
    sujet: z.enum(SujetDemandeEnum).nullable(),
    targetStar: requestableAuditStarSchema.nullable(),
  })
  .transform((draft, ctx) => {
    if (draft.sujet === SujetDemandeEnum.COT) {
      return { sujet: SujetDemandeEnum.COT };
    }
    if (draft.sujet !== null && draft.targetStar !== null) {
      return { sujet: draft.sujet, targetStar: draft.targetStar };
    }
    ctx.addIssue({
      code: 'custom',
      message: appLabels.demarrerAuditSelectionIncomplete,
    });
    return z.NEVER;
  });

export type AuditSelectionDraft = z.input<typeof auditSelectionSchema>;
export type AuditSelection = z.output<typeof auditSelectionSchema>;

export type RequestAuditInput =
  RouterInput['referentiels']['labellisations']['requestLabellisation'];

export const auditSelectionToRequestInput = (
  {
    collectiviteId,
    referentiel,
  }: { collectiviteId: number; referentiel: ReferentielId },
  selection: AuditSelection
): RequestAuditInput =>
  selection.sujet === SujetDemandeEnum.COT
    ? { collectiviteId, referentiel, sujet: SujetDemandeEnum.COT, etoiles: null }
    : {
        collectiviteId,
        referentiel,
        sujet: selection.sujet,
        etoiles: selection.targetStar,
      };
