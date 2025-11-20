import { z } from 'zod';

export const tableauDeBordModuleSchema = z.object({
  id: z.uuid(),
  collectiviteId: z.number(),
  userId: z.uuid().nullable(),
  titre: z.string(),
  defaultKey: z.string().nullable(),
  type: z.string(),
  options: z.json(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

export type TableauDeBordModule = z.infer<typeof tableauDeBordModuleSchema>;

export const tableauDeBordModuleSchemaCreate =
  tableauDeBordModuleSchema.partial({
    userId: true,
    defaultKey: true,
    createdAt: true,
    modifiedAt: true,
  });
