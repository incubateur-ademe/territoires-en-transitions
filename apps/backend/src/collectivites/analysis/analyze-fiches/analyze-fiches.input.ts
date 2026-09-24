import { failure, success, type Result } from '@tet/backend/utils/result.type';
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

const COLLECTIVITES_ARGUMENT = '--collectivites';

const toCollectivitesValue = (argument: string): string | undefined => {
  if (argument === COLLECTIVITES_ARGUMENT) {
    return '';
  }
  const prefix = `${COLLECTIVITES_ARGUMENT}=`;
  return argument.startsWith(prefix)
    ? argument.slice(prefix.length)
    : undefined;
};

const isCanonicalNumber = (rawCollectiviteId: string): boolean =>
  String(Number(rawCollectiviteId)) === rawCollectiviteId;

const isCollectiviteId = (rawCollectiviteId: string): boolean =>
  isCanonicalNumber(rawCollectiviteId) &&
  collectiviteSelectionSchema.safeParse([Number(rawCollectiviteId)]).success;

const toCollectiviteIdsScope = (
  value: string
): Result<AnalyzeFichesInputScope, AnalyzeFichesInputError> => {
  const rawCollectiviteIds = value.split(',');
  const invalidRawCollectiviteId = rawCollectiviteIds.find(
    (rawCollectiviteId) => !isCollectiviteId(rawCollectiviteId)
  );
  if (invalidRawCollectiviteId !== undefined) {
    return failure({
      kind: 'invalid_collectivite_id',
      value: invalidRawCollectiviteId,
    });
  }
  const selection = collectiviteSelectionSchema.safeParse(
    rawCollectiviteIds.map(Number)
  );
  if (!selection.success) {
    return failure({ kind: 'empty_collectivites' });
  }
  return success({ kind: 'collectivites', collectivites: selection.data });
};

const toCollectivitesScope = (
  value: string
): Result<AnalyzeFichesInputScope, AnalyzeFichesInputError> => {
  if (value === '') {
    return failure({ kind: 'empty_collectivites' });
  }
  if (value === 'all') {
    return success({ kind: 'collectivites', collectivites: 'all' });
  }
  return toCollectiviteIdsScope(value);
};

export const toAnalyzeFichesInputScope: ToAnalyzeFichesInputScope = (argv) => {
  const [argument, extraArgument] = argv;
  if (argument === undefined) {
    return success({ kind: 'daily' });
  }
  if (extraArgument !== undefined) {
    return failure({ kind: 'unknown_argument', argument: extraArgument });
  }
  const value = toCollectivitesValue(argument);
  if (value === undefined) {
    return failure({ kind: 'unknown_argument', argument });
  }
  return toCollectivitesScope(value);
};
