import { describe, expect, it } from 'vitest';
import { type ClassificationProgress } from '../classification-leviers-job.repository';
import { ClassificationLeviersErrorEnum } from '../classification-leviers.errors';
import { type ClassificationDraft } from '../models/classification-draft';
import {
  ClassificationLeviersJobStatus,
  ClassificationLeviersJobStatusEnum,
} from '../models/classification-leviers-job';
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
  status: ClassificationLeviersJobStatus;
  draft?: ClassificationDraft | null;
  error?: string | null;
}): ClassificationProgress => ({
  id: jobId,
  collectiviteId: 3,
  planId,
  status,
  processedBatches: 2,
  totalBatches: 3,
  draft,
  error,
});

describe('toClassificationStatus', () => {
  it('rend la progression sur un job en attente', () => {
    const result = toClassificationStatus(
      toProgress({ status: ClassificationLeviersJobStatusEnum.PENDING })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        planId,
        status: ClassificationLeviersJobStatusEnum.PENDING,
        processedBatches: 2,
        totalBatches: 3,
      },
    });
  });

  it('rend le classement sur un job termine, sans compteur de lots', () => {
    const result = toClassificationStatus(
      toProgress({ status: ClassificationLeviersJobStatusEnum.DONE, draft })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        planId,
        status: ClassificationLeviersJobStatusEnum.DONE,
        draft,
      },
    });
  });

  it("rend l'erreur sur un job en echec, sans compteur de lots", () => {
    const result = toClassificationStatus(
      toProgress({
        status: ClassificationLeviersJobStatusEnum.FAILED,
        error: 'Aucune fiche à classer dans ce plan',
      })
    );

    expect(result).toEqual({
      success: true,
      data: {
        id: jobId,
        planId,
        status: ClassificationLeviersJobStatusEnum.FAILED,
        error: 'Aucune fiche à classer dans ce plan',
      },
    });
  });

  it('refuse un job termine dont le classement est absent', () => {
    const result = toClassificationStatus(
      toProgress({ status: ClassificationLeviersJobStatusEnum.DONE })
    );

    expect(result).toEqual({
      success: false,
      error: ClassificationLeviersErrorEnum.GET_JOB_ERROR,
    });
  });

  it('refuse un job en echec dont le motif est absent', () => {
    const result = toClassificationStatus(
      toProgress({ status: ClassificationLeviersJobStatusEnum.FAILED })
    );

    expect(result).toEqual({
      success: false,
      error: ClassificationLeviersErrorEnum.GET_JOB_ERROR,
    });
  });
});
