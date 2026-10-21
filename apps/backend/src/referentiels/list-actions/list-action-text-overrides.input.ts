import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const listActionTextOverridesInputSchema = z.object({
  referentielId: referentielIdEnumSchema,
  /**
   * Version publiée lue dans l'état (`listActionsGroupedById`). Ne sert que de
   * clé de cache côté front : la réponse porte toujours sur la version
   * publiée, et la renvoie.
   */
  referentielVersion: z.string(),
  /** `textVariantKey` renvoyé par `listActionsGroupedById` */
  textVariantKey: z.string().min(1),
});

export type ListActionTextOverridesInput = z.infer<
  typeof listActionTextOverridesInputSchema
>;
