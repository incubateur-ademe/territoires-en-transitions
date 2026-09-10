import { describe, expect, it } from 'vitest';
import { type ClassificationProgress } from '../classification-volets-job.repository';
import { ClassificationVoletsErrorEnum } from '../classification-volets.errors';
import { type ClassificationDraft } from '../models/classification-draft';
import {
  ClassificationVoletsJobStatus,
  ClassificationVoletsJobStatusEnum,
} from '../models/classification-volets-job';
import { toClassificationStatus } from './get-classification-status.adapter';

const jobId = '00000000-0000-0000-0000-000000000001';
const planId = 42;

const draft: ClassificationDraft = {
  fiches: [],
  unclassified: [{ ficheId: 7, reason: 'truncated' }],
};

const toProgress = ({
  status,
  draft = null,
  error = null,
}: {
  status: ClassificationVoletsJobStatus;
  draft?: ClassificationDraft | null;
  error?: string | null;
}): ClassificationProgress => ({
  id: jobId,
  collectiviteId: 3,
  planId,
  enjeu: 'ges',
  status,
  processedBatches: 2,
  totalBatches: 3,
  draft,
  error,
});

describe('toClassificationStatus', () => {
  it('rend la progression sur un job en attente', () => {
    const result = toClassificationStatus(
      toProgress({ status: ClassificationVoletsJobStatusEnum.PENDING })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        planId,
        enjeu: 'ges',
        status: ClassificationVoletsJobStatusEnum.PENDING,
        processedBatches: 2,
        totalBatches: 3,
      },
    });
  });

  it('rend le classement sur un job termine, sans compteur de lots', () => {
    const result = toClassificationStatus(
      toProgress({ status: ClassificationVoletsJobStatusEnum.DONE, draft })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        planId,
        enjeu: 'ges',
        status: ClassificationVoletsJobStatusEnum.DONE,
        draft,
      },
    });
  });

  it("rend l'erreur sur un job en echec, sans compteur de lots", () => {
    const result = toClassificationStatus(
      toProgress({
        status: ClassificationVoletsJobStatusEnum.FAILED,
        error: 'Aucune fiche à classer dans ce plan',
      })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        planId,
        enjeu: 'ges',
        status: ClassificationVoletsJobStatusEnum.FAILED,
        error: 'Aucune fiche à classer dans ce plan',
      },
    });
  });

  it('refuse un job termine dont le classement est absent', () => {
    const result = toClassificationStatus(
      toProgress({ status: ClassificationVoletsJobStatusEnum.DONE })
    );

    expect(result).toEqual({
      success: false,
      error: ClassificationVoletsErrorEnum.GET_JOB_ERROR,
    });
  });

  it('refuse un job en echec dont le motif est absent', () => {
    const result = toClassificationStatus(
      toProgress({ status: ClassificationVoletsJobStatusEnum.FAILED })
    );

    expect(result).toEqual({
      success: false,
      error: ClassificationVoletsErrorEnum.GET_JOB_ERROR,
    });
  });
});
