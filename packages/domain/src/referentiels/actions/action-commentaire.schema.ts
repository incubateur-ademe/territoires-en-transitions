import * as z from 'zod/mini';

export const actionCommentaireSchema = z.object({
  collectiviteId: z.number(),
  actionId: z.string(),
  commentaire: z.string(),
  modifiedBy: z.nullable(z.uuid()),
  modifiedAt: z.iso.datetime(),
});

export type ActionCommentaire = z.infer<typeof actionCommentaireSchema>;

export const actionCommentaireSchemaCreate = z.omit(actionCommentaireSchema, {
  modifiedBy: true,
  modifiedAt: true,
});

export type ActionCommentaireCreate = z.infer<
  typeof actionCommentaireSchemaCreate
>;
