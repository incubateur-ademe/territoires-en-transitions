import { z } from 'zod';

export const importTrajectoireSnbc3InputSchema = z.object({
  version: z
    .string()
    .regex(/^\d+(\.\d+)*$/)
    .describe(
      'Version de la release GitHub v<version> du dépôt snbc3 (ex. 2.3) ; la date de publication de son manifeste sert de millésime'
    ),
  collectiviteIds: z
    .array(z.number().int())
    .min(1)
    .optional()
    .describe(
      'Rejoue l’import pour ces collectivités seulement, avec la release du dernier import complet ; sans ce filtre, les collectivités absentes de la release perdent leurs valeurs snbc3'
    ),
});

export type ImportTrajectoireSnbc3Input = z.infer<
  typeof importTrajectoireSnbc3InputSchema
>;

export type ImportTrajectoireSnbc3Report = {
  /** SHA complet du commit `snbc3` noté dans le manifeste de la release. */
  commit: string;
  version: string;
  /** Date de publication de la release (ISO, UTC). */
  dateVersion: string;
  metadonneeId: number;
  /** Territoires du parquet. */
  territoireCount: number;
  /** Codes `code_epci` sans collectivité TeT. */
  unmatchedTerritoires: string[];
  /** EPCI à fiscalité propre et EPT de TeT absents de la release. */
  epciIdsWithoutTrajectoire: number[];
  /** Collectivités dont les valeurs snbc3 ont été supprimées (import complet). */
  clearedCollectiviteIds: number[];
  /**
   * Valeurs importées, hors totaux calculés, dans tous les compteurs.
   * `unchanged` : identiques à celles en base, donc non réécrites. `deleted` :
   * valeurs importées supprimées, qu'elles ne soient plus produites ou que leur
   * collectivité soit absente de la release ; les totaux supprimés ou
   * recalculés à leur suite ne sont pas comptés.
   */
  valeurs: {
    created: number;
    updated: number;
    unchanged: number;
    deleted: number;
  };
  errors: { territoire: string; collectiviteId: number; message: string }[];
  durationMs: number;
};

/** Réponse de la mutation : l'import tourne dans un job BullMQ. */
export type ImportTrajectoireSnbc3Enqueued = { jobId: string };

/** Contenu de `last-import.json`, réécrit à chaque étape de l'import. */
export type Snbc3LastImport = {
  /**
   * `done_with_errors` : import allé au bout, mais des territoires sont en
   * erreur (`report.errors`), à rejouer avec `collectiviteIds`.
   */
  status: 'running' | 'done' | 'done_with_errors' | 'failed';
  startedAt: string;
  finishedAt?: string;
  /** Version demandée ; le commit, lu dans le manifeste, est dans le rapport. */
  version: string;
  /** Rejeu partiel : seules ces collectivités ont été réimportées. */
  collectiviteIds?: number[];
  error?: string;
  /** Absent si l'import a échoué avant de remplacer les valeurs. */
  report?: ImportTrajectoireSnbc3Report;
};
