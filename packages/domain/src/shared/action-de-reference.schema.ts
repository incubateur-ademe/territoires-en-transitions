import * as z from 'zod/mini';
import { categorieActionEnumValues } from './categorie-action.enum';
import { levierIdEnumValues } from './levier.enum';
import { nonBlankTextSchema } from './non-blank-text.schema';

export const actionDeReferenceIdSchema = z
  .int32()
  .check(z.positive())
  .brand<'ActionDeReferenceId'>();

export type ActionDeReferenceId = z.infer<typeof actionDeReferenceIdSchema>;

export const actionDeReferenceSchema = z.object({
  id: actionDeReferenceIdSchema,
  titre: nonBlankTextSchema,
  description: nonBlankTextSchema,
  levier: z.enum(levierIdEnumValues),
  categorie: z.enum(categorieActionEnumValues),
});

export type ActionDeReference = z.infer<typeof actionDeReferenceSchema>;

const actionDeReferenceSortFieldEnumValues = [
  'titre',
  'levier',
  'categorie',
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
  titre: searchedTextSchema,
  description: searchedTextSchema,
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

export const updateActionDeReferenceInputSchema = z.extend(
  actionDeReferenceChangesSchema,
  { id: actionDeReferenceIdSchema }
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
