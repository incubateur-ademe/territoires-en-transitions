import { z } from 'zod';

export const electrificationDataKindSchema = z.enum(['catalogue', 'laureats']);
export type ElectrificationDataKind = z.infer<
  typeof electrificationDataKindSchema
>;

export const prepareElectrificationDataInputSchema = z.discriminatedUnion(
  'kind',
  [
    z.strictObject({
      kind: z.literal('catalogue'),
      version: z.string().trim().min(1),
    }),
    z.strictObject({
      kind: z.literal('laureats'),
      version: z.string().trim().min(1),
      validFrom: z.iso.datetime(),
    }),
  ]
);
export type PrepareElectrificationDataInput = z.infer<
  typeof prepareElectrificationDataInputSchema
>;

// Le rapport de vérification localise aussi les erreurs de schéma dans le document.
export const publishElectrificationDataInputSchema = z.strictObject({
  kind: electrificationDataKindSchema,
  data: z.unknown(),
});
export type PublishElectrificationDataInput = z.infer<
  typeof publishElectrificationDataInputSchema
>;

export const getElectrificationDataInputSchema = z.strictObject({
  kind: electrificationDataKindSchema,
  version: z.string().trim().min(1).optional(),
});
export type GetElectrificationDataInput = z.infer<
  typeof getElectrificationDataInputSchema
>;

export const verifyElectrificationDataOutputSchema = z.object({
  valid: z.boolean(),
  issues: z.array(z.object({ location: z.string(), message: z.string() })),
});
export type ElectrificationDataIssue = z.infer<
  typeof verifyElectrificationDataOutputSchema
>['issues'][number];
