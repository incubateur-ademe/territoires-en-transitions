import { z } from 'zod';

const terme = z.string().trim().min(2).max(60);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ');

// `nullish` : les modèles envoient souvent `null` pour un argument absent.
export const supportConversationsFilterSchema = z.object({
  sujet: z
    .string()
    .min(1)
    .max(80)
    .nullish()
    .describe(
      "Sujet cherché dans les segments Crisp, un ou plusieurs mots de segment : 'cr' (référentiel CR), 'referentiel', 'import_plan', 'audit_labellisation', 'connexion', 'pcaet', ou un type ('bug', 'besoin_guidage'). Absent : tout le support."
    ),
  // Une chaîne seule est acceptée : les modèles l'envoient souvent ainsi.
  termes: z
    .union([terme, z.array(terme).min(1).max(8)])
    .nullish()
    .describe(
      "Mots ou expressions cherchés dans les messages (l'un ou l'autre suffit), sans tenir compte des accents ni de la casse, en mot entier. Seulement si aucun segment ne correspond : la recherche rate les conversations où le mot n'est pas écrit (« CR » trouve 3 conversations quand le segment en compte 19). Lit chaque conversation de la période : préférer une période courte."
    ),
  dateFrom: isoDate
    .nullish()
    .describe(
      'Début (AAAA-MM-JJ), date de création des conversations ; absent = il y a 90 jours.'
    ),
  dateTo: isoDate
    .nullish()
    .describe(
      "Fin incluse (AAAA-MM-JJ) ; absente = aujourd'hui. 366 jours au plus."
    ),
});

export type SupportConversationsFilter = z.infer<
  typeof supportConversationsFilterSchema
>;
