import * as z from 'zod/mini';

export const DemarchePcaetPublicationStatusEnum = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export const demarchePcaetPublicationStatusValues = [
  DemarchePcaetPublicationStatusEnum.DRAFT,
  DemarchePcaetPublicationStatusEnum.PUBLISHED,
] as const;

export const demarchePcaetPublicationStatusSchema = z.enum(
  demarchePcaetPublicationStatusValues
);

export type DemarchePcaetPublicationStatus = z.infer<
  typeof demarchePcaetPublicationStatusSchema
>;
