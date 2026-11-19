import { z } from 'zod';
import { DEMARCHE_PCAET_EXPORT_TRANSITIONS } from '../../shared/models/demarche-pcaet-export.table';

/**
 * Un classeur proposé au téléchargement : l'export figé d'une soumission, ou
 * l'export du jour pour un dépôt qui n'en a pas. `null` : rien à télécharger.
 */
export const demarchePcaetExportEntrySchema = z
  .discriminatedUnion('source', [
    z.object({
      source: z.literal('snapshot'),
      transition: z.enum(DEMARCHE_PCAET_EXPORT_TRANSITIONS),
      createdAt: z.string(),
    }),
    z.object({ source: z.literal('on_demand') }),
  ])
  .nullable();
export type DemarchePcaetExportEntry = z.infer<
  typeof demarchePcaetExportEntrySchema
>;

export const listDemarchePcaetExportsOutputSchema = z.object({
  plan: demarchePcaetExportEntrySchema,
  indicateurs: demarchePcaetExportEntrySchema,
});
export type ListDemarchePcaetExportsOutput = z.infer<
  typeof listDemarchePcaetExportsOutputSchema
>;

export type DemarchePcaetExportUrl = { url: string; filename: string };
