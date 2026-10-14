import * as z from 'zod/mini';
import { categorieActionEnumValues } from './categorie-action.enum';
import { levierIdEnumValues } from './levier.enum';
import { nonBlankTextSchema } from './non-blank-text.schema';

export const actionDeReferenceIdSchema = z
  .int32()
  .check(z.positive())
  .brand<'ActionDeReferenceId'>();

export type ActionDeReferenceId = z.infer<typeof actionDeReferenceIdSchema>;

const TITRE_MAX_CHARACTER_COUNT = 300;

const titreSchema = nonBlankTextSchema.check(
  z.superRefine((titre, ctx) => {
    const exceedsMaxCharacterCount =
      titre.length > 2 * TITRE_MAX_CHARACTER_COUNT ||
      [...titre].length > TITRE_MAX_CHARACTER_COUNT;
    if (exceedsMaxCharacterCount) {
      ctx.addIssue({
        code: 'too_big',
        origin: 'string',
        maximum: TITRE_MAX_CHARACTER_COUNT,
        inclusive: true,
        input: titre,
      });
    }
  })
);

const hasNoDuplicate = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

export const actionDeReferenceSchema = z.object({
  id: actionDeReferenceIdSchema,
  titre: titreSchema,
  description: nonBlankTextSchema,
  leviers: z
    .array(z.enum(levierIdEnumValues))
    .check(z.minLength(1), z.refine(hasNoDuplicate)),
  categories: z
    .array(z.enum(categorieActionEnumValues))
    .check(z.minLength(1), z.refine(hasNoDuplicate)),
});

export type ActionDeReference = z.infer<typeof actionDeReferenceSchema>;

export const getActionDeReferenceInputSchema = z.pick(actionDeReferenceSchema, {
  id: true,
});

export type GetActionDeReferenceInput = z.output<
  typeof getActionDeReferenceInputSchema
>;

export const listFichesActionDeReferenceInputSchema = z.extend(
  getActionDeReferenceInputSchema,
  { excludedCollectiviteId: z.optional(z.int32().check(z.positive())) }
);

export type ListFichesActionDeReferenceInput = z.output<
  typeof listFichesActionDeReferenceInputSchema
>;

export const actionDeReferenceSortFieldEnumValues = [
  'titre',
  'leviers',
  'categories',
] as const;

const searchedTextSchema = z.optional(
  z.pipe(
    z.string().check(z.trim()),
    z.transform((text) => (text === '' ? undefined : text))
  )
);

const toFilterListSchema = <Value extends string>(
  values: readonly [Value, ...Value[]]
) =>
  z.optional(
    z.pipe(
      z.readonly(z.array(z.enum(values))),
      z.transform((list) => (list.length === 0 ? undefined : list))
    )
  );

export const listActionsDeReferenceInputSchema = z.object({
  searchedText: searchedTextSchema,
  leviers: toFilterListSchema(levierIdEnumValues),
  categories: toFilterListSchema(categorieActionEnumValues),
  sortBy: z._default(z.enum(actionDeReferenceSortFieldEnumValues), 'titre'),
});

export type ListActionsDeReferenceInput = z.output<
  typeof listActionsDeReferenceInputSchema
>;

export const actionDeReferenceChangesSchema = z.partial(
  z.omit(actionDeReferenceSchema, { id: true })
);

export type ActionDeReferenceChanges = z.output<
  typeof actionDeReferenceChangesSchema
>;

const linkedFicheIdSchema = z.int32().check(z.positive());

export const updateActionDeReferenceInputSchema = z.extend(
  actionDeReferenceChangesSchema,
  {
    id: actionDeReferenceIdSchema,
    ficheIds: z.optional(z.array(linkedFicheIdSchema)),
  }
);

export type UpdateActionDeReferenceInput = z.output<
  typeof updateActionDeReferenceInputSchema
>;

export const updateActionDeReferenceOutputSchema = z.pick(
  actionDeReferenceSchema,
  { id: true }
);

export type UpdateActionDeReferenceOutput = z.output<
  typeof updateActionDeReferenceOutputSchema
>;
