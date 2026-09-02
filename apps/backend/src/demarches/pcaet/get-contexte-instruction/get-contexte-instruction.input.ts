import { z } from 'zod';

export const getContexteInstructionInputSchema = z.object({
  /** La collectivité consultée, dont on cherche à savoir si elle est instruite. */
  collectiviteId: z.number().int().positive(),
  /**
   * Saisine visée, quand l'appelant en connaît une — le cas de l'écran de
   * dossier, dont l'URL porte les deux identifiants. Le service ne répond alors
   * que si cette saisine porte bien sur `collectiviteId` : sans ce contrôle, une
   * URL forgée afficherait le dossier d'une collectivité sous le nom d'une
   * autre.
   */
  demandeAvisId: z.number().int().positive().optional(),
});

export type GetContexteInstructionInput = z.infer<
  typeof getContexteInstructionInputSchema
>;
