import { Injectable } from '@nestjs/common';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Enjeu } from '@tet/domain/shared';
import { DECLARED_ENJEUX, isDeclaredEnjeu } from '../analysis-enjeux';
import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';
import {
  ClassifyFichesError,
  classifyFiches,
} from '../pipeline/classify-fiches/classify-fiches';
import { FicheToClassify } from '../pipeline/classify-fiches/render-fiches-text';

export type ClassifyBatchOutcome = {
  classified: ClassifiedFiche[];
  sources: FicheToClassify[];
  tokens: TokenUsage;
};

export type ClassifyBatchFailure =
  | ClassifyFichesError
  | { kind: 'unknown_enjeu'; enjeu: string };

@Injectable()
export class ClassifyBatchService {
  constructor(private readonly llm: LlmService) {}

  async classify({
    enjeu,
    fiches,
    signal,
  }: {
    enjeu: Enjeu;
    fiches: FicheToClassify[];
    signal?: AbortSignal;
  }): Promise<Result<ClassifyBatchOutcome, ClassifyBatchFailure>> {
    if (!isDeclaredEnjeu(enjeu)) {
      return failure({ kind: 'unknown_enjeu', enjeu });
    }

    const classification = await classifyFiches(this.llm, {
      enjeu: DECLARED_ENJEUX[enjeu],
      fiches,
      signal,
    });
    if (!classification.success) {
      return classification;
    }

    return success({
      classified: classification.data.fiches,
      sources: fiches,
      tokens: classification.data.tokens,
    });
  }
}
