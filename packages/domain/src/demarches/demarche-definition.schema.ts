import * as z from 'zod/mini';

/**
 * Ce que le dépôt autorise pour un type de démarche, au-delà du catalogue des
 * pièces attendues : de la donnée (`demarche_definition`), pas une règle codée
 * en dur, pour qu'un nouveau type se configure sans toucher au code.
 */
export const demarcheDocumentsConfigSchema = z.object({
  /** La collectivité peut joindre des pièces hors catalogue au dossier d'élaboration. */
  additionalAmont: z.boolean(),
  /** Même autorisation pour les pièces produites après les avis. */
  additionalAval: z.boolean(),
  /** Extensions acceptées, sans le point. `null` : aucune restriction propre au type. */
  formatsAutorises: z.nullable(z.array(z.string())),
  /** Vérifiés en plus de l'extension quand le stockage connaît le type. `null` : aucune restriction. */
  mimeTypesAutorises: z.nullable(z.array(z.string())),
});

export type DemarcheDocumentsConfig = z.infer<
  typeof demarcheDocumentsConfigSchema
>;

/**
 * Repli quand un type de démarche n'a pas encore de ligne de configuration :
 * rien d'additionnel — une autorisation ne s'obtient que par déclaration
 * explicite — et aucune restriction de format, ce sont alors les formats
 * acceptés partout ailleurs dans le produit qui s'appliquent.
 */
export const DEMARCHE_DOCUMENTS_CONFIG_DEFAULT: DemarcheDocumentsConfig = {
  additionalAmont: false,
  additionalAval: false,
  formatsAutorises: null,
  mimeTypesAutorises: null,
};
