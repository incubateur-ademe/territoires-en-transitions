import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';

export const upsertIndicateurDefinitionPilotesInputSchema = createInsertSchema(
  indicateurPiloteTable
).omit({
  id: true,
  collectiviteId: true,
  indicateurId: true,
});

export type UpsertIndicateurDefinitionPilotesInput = z.infer<
  typeof upsertIndicateurDefinitionPilotesInputSchema
>;
