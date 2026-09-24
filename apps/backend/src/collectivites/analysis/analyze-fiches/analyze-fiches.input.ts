import { notImplemented } from '@tet/backend/utils/not-implemented';
import { type Result } from '@tet/backend/utils/result.type';
import { enjeuEnumValues } from '@tet/domain/shared';
import { z } from 'zod';
import { AnalyzeFichesInputError } from './analyze-fiches.errors';

export const collectiviteSelectionSchema = z.union([
  z.literal('all'),
  z.array(z.number().int().positive()).nonempty().readonly(),
]);

const analyzeFichesInputScopeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('daily'),
    collectivites: z.optional(z.undefined()),
  }),
  z.object({
    kind: z.literal('collectivites'),
    collectivites: collectiviteSelectionSchema,
  }),
]);

export type AnalyzeFichesInputScope = z.output<
  typeof analyzeFichesInputScopeSchema
>;

export const analyzeFichesInputSchema = z.object({
  enjeu: z.enum(enjeuEnumValues),
  scope: analyzeFichesInputScopeSchema,
  startedAt: z.date(),
});

export type AnalyzeFichesInput = z.output<typeof analyzeFichesInputSchema>;

type ToAnalyzeFichesInputScope = (
  argv: readonly string[]
) => Result<AnalyzeFichesInputScope, AnalyzeFichesInputError>;

export const toAnalyzeFichesInputScope: ToAnalyzeFichesInputScope =
  notImplemented('toAnalyzeFichesInputScope');
