import z from 'zod';

/*
 * Schéma pour une personne (référent ou pilote)
 */
export const personneIdSchema = z.union([
  z.object({ tagId: z.number(), userId: z.null().optional() }),
  z.object({ tagId: z.null().optional(), userId: z.string() }),
]);

export type PersonneId = z.infer<typeof personneIdSchema>;

export type Personne = {
  userId: string | null;
  userName: string | null;
  tagId: number | null;
  tagName: string | null;
};
