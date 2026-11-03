import { Injectable } from '@nestjs/common';
import { failure, type Result } from '@tet/backend/utils/result.type';
import { Enjeu } from '@tet/domain/shared';
import { DECLARED_ENJEUX, isDeclaredEnjeu } from '../analysis-enjeux';
import { ClassificationLlmService } from '../classification-llm.service';
import {
  classifyFiche,
  ClassifyFicheResult,
} from '../pipeline/classify-fiche/classify-fiche';
import { FicheToClassify } from '../pipeline/classify-fiche/render-fiche-text';
import { ClassifyFicheFailure } from './classify-fiche.errors';

@Injectable()
export class ClassifyFicheService {
  constructor(private readonly llm: ClassificationLlmService) {}

  async classify({
    enjeu,
    fiche,
    signal,
  }: {
    enjeu: Enjeu;
    fiche: FicheToClassify;
    signal?: AbortSignal;
  }): Promise<Result<ClassifyFicheResult, ClassifyFicheFailure>> {
    if (!isDeclaredEnjeu(enjeu)) {
      return failure({ kind: 'unknown_enjeu', enjeu });
    }

    return classifyFiche(this.llm, {
      enjeu: DECLARED_ENJEUX[enjeu],
      fiche,
      signal,
    });
  }
}
