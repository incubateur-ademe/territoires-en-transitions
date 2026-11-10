import { ficheImportFieldsSchema } from '@tet/domain/plans';
import { z } from 'zod';
import * as mini from 'zod/mini';
import { engagementImportSchema } from '../../models/engagement-import.schema';
import type { DocumentLink } from '../../pipeline/document/document-page';
import { ficheImportSchema } from '../../prepare-fiche/prepare-fiche.schema';
import {
  electrificationIndicateurInputSchema,
  resolveElectrificationFichesInputSchema,
} from '../resolve-fiches/electrification-fiches.schema';

/** Le contexte serveur fournit la collectivité et la version du catalogue. */
export const electrificationDocumentDraftSchema =
  resolveElectrificationFichesInputSchema.omit({
    collectiviteId: true,
    catalogueVersion: true,
  });

export type ElectrificationDocumentDraft = z.infer<
  typeof electrificationDocumentDraftSchema
>;

const sourceIdSchema = z.string().trim().min(1);
const documentLocationSchema = z.strictObject({
  pageIndex: z.number().int().nonnegative(),
  lineIndex: z.number().int().nonnegative().optional(),
  tableIndex: z.number().int().nonnegative().optional(),
  sheetName: z.string().optional(),
  row: z.number().int().positive().optional(),
  col: z.number().int().positive().optional(),
  rect: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
});
const documentLinkSchema = z.strictObject({
  text: z.string(),
  target: z.string().nullable(),
  kind: z.enum(['hyperlink', 'text']),
  location: documentLocationSchema,
}) satisfies z.ZodType<DocumentLink>;

/** Registre des cellules du formulaire, produit par le lecteur. */
export const electrificationDocumentSourceSchema = z.strictObject({
  id: sourceIdSchema,
  section: z.enum(['A', 'B', 'unknown']),
  text: z.string(),
  location: sourceIdSchema,
  links: z.array(documentLinkSchema),
});
export type ElectrificationDocumentSource = z.infer<
  typeof electrificationDocumentSourceSchema
>;

const referenceSchema = z.strictObject({
  sourceId: sourceIdSchema.nullable(),
  value: z.string().trim().min(1).nullable(),
});
// Les absences sont explicites ; les champs restent ceux du domaine.
const champsSchema = mini.required(ficheImportFieldsSchema);
const sousActionSchema = ficheImportSchema.shape.sousActions.element.extend({
  source: sourceIdSchema,
  reference: referenceSchema,
  champs: champsSchema,
});
const indicateurSchema = z.discriminatedUnion('type', [
  electrificationIndicateurInputSchema.options[0].extend({
    source: sourceIdSchema,
    reference: referenceSchema,
  }),
  electrificationIndicateurInputSchema.options[1].extend({
    source: sourceIdSchema,
    reference: referenceSchema,
  }),
]);
const axeSchema = electrificationDocumentDraftSchema.shape.axes.element;

/** Identités documentaires uniquement : pas d'identifiant TeT ni de localisation libre. */
export const electrificationExtractionResponseSchema = z.strictObject({
  engagements: z.array(
    engagementImportSchema.extend({
      source: sourceIdSchema,
      cibles: z.array(
        engagementImportSchema.shape.cibles.element.extend({
          source: sourceIdSchema,
        })
      ),
    })
  ),
  axes: z.array(
    axeSchema.extend({
      source: sourceIdSchema,
      sousAxes: z.array(
        axeSchema.shape.sousAxes.element.extend({ source: sourceIdSchema })
      ),
    })
  ),
  fiches: z.array(
    ficheImportSchema.extend({
      source: sourceIdSchema,
      reference: referenceSchema,
      champs: champsSchema,
      sousActions: z.array(sousActionSchema),
      indicateurs: z.array(indicateurSchema),
    })
  ),
});
export type ElectrificationExtractionResponse = z.infer<
  typeof electrificationExtractionResponseSchema
>;
