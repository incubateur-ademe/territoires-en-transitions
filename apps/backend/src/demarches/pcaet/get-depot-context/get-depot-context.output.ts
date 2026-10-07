import { z } from 'zod';

export const depotContextSchema = z.object({
  /**
   * La question « votre PCAET est-il un SCoT-AEC ? » doit-elle être posée ?
   *
   * Vrai quand la collectivité exerce la compétence Banatic 5500 (SCOT). Le
   * serveur répond par oui ou non plutôt que de livrer la compétence brute : le
   * formulaire n'a pas à connaître la nomenclature Banatic pour savoir quoi
   * afficher.
   */
  peutDeclarerScotAec: z.boolean(),
});

export type DepotContext = z.infer<typeof depotContextSchema>;
