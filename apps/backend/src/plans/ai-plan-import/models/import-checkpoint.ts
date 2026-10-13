import type { PipelineCheckpoint } from '../pipeline/pipeline-checkpoint';
import type { ImportJobStats } from './import-job-stats';

/**
 * Point de reprise gardé sur le job : la pipeline telle qu'après sa dernière
 * étape terminée, et ce que le service avait relevé du document lu.
 */
export type ImportCheckpoint = PipelineCheckpoint & {
  documentStats: ImportJobStats['document'];
};
