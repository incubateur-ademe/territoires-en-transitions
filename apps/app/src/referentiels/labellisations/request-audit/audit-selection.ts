import { appLabels } from '@/app/labels/catalog';
import type { RouterInput } from '@tet/api';
import {
  Etoile,
  ReferentielId,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { z } from 'zod';

export const auditSelectionSchema = z
  .object({
    sujet: z.enum(SujetDemandeEnum).nullable(),
  })
  .transform((draft, ctx) => {
    if (draft.sujet !== null) {
      return { sujet: draft.sujet };
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
    etoile,
  }: { collectiviteId: number; referentiel: ReferentielId; etoile: Etoile },
  selection: AuditSelection
): RequestAuditInput => ({
  collectiviteId,
  referentiel,
  sujet: selection.sujet,
  etoiles: selection.sujet === SujetDemandeEnum.COT ? null : etoile,
});
