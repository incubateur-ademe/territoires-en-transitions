import { type AnalysisStep } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { type ClassificationProgress } from '../analysis-job.repository';
import { AnalysisJobErrorEnum } from '../analysis-job.errors';
import { type ClassificationDraft } from '../models/classification-draft';
import {
  AnalysisJobStatus,
  AnalysisJobStatusEnum,
} from '../models/analysis-job';
import { toAnalysisStatus } from './get-analysis-status.adapter';

const jobId = '00000000-0000-0000-0000-000000000001';
const collectiviteId = 3;

const draft: ClassificationDraft = {
  fiches: [],
};

const toProgress = ({
  status,
  draft = null,
  error = null,
  etape = 'classification',
}: {
  status: AnalysisJobStatus;
  draft?: ClassificationDraft | null;
  error?: string | null;
  etape?: AnalysisStep;
}): ClassificationProgress => ({
  id: jobId,
  collectiviteId,
  enjeu: 'ges',
  etape,
  status,
  processedBatches: 2,
  totalBatches: 3,
  draft,
  error,
});

describe('toAnalysisStatus', () => {
  it('rend la progression sur un job en attente', () => {
    const result = toAnalysisStatus(
      toProgress({ status: AnalysisJobStatusEnum.PENDING })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        collectiviteId,
        enjeu: 'ges',
        etape: 'classification',
        status: AnalysisJobStatusEnum.PENDING,
        processedBatches: 2,
        totalBatches: 3,
      },
    });
  });

  it('rend le classement sur une analyse terminee, sans compteur de lots', () => {
    const result = toAnalysisStatus(
      toProgress({
        status: AnalysisJobStatusEnum.DONE,
        draft,
        etape: 'mobilisation',
      })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        collectiviteId,
        enjeu: 'ges',
        etape: 'mobilisation',
        status: AnalysisJobStatusEnum.DONE,
        draft,
      },
    });
  });

  it("rend l'erreur sur un job en echec, sans compteur de lots", () => {
    const result = toAnalysisStatus(
      toProgress({
        status: AnalysisJobStatusEnum.FAILED,
        error: 'Aucune fiche à classer dans cette collectivité',
      })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        collectiviteId,
        enjeu: 'ges',
        etape: 'classification',
        status: AnalysisJobStatusEnum.FAILED,
        error: 'Aucune fiche à classer dans cette collectivité',
      },
    });
  });

  it('refuse un job termine dont le classement est absent', () => {
    const result = toAnalysisStatus(
      toProgress({ status: AnalysisJobStatusEnum.DONE })
    );

    expect(result).toEqual({
      success: false,
      error: AnalysisJobErrorEnum.GET_JOB_ERROR,
    });
  });

  it('refuse un job en echec dont le motif est absent', () => {
    const result = toAnalysisStatus(
      toProgress({ status: AnalysisJobStatusEnum.FAILED })
    );

    expect(result).toEqual({
      success: false,
      error: AnalysisJobErrorEnum.GET_JOB_ERROR,
    });
  });
});
