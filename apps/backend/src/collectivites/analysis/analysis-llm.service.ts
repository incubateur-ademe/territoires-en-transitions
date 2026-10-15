import { Injectable, Optional } from '@nestjs/common';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { LlmObserver } from '@tet/backend/utils/llm/llm-observer';
import { MistralRepository } from '@tet/backend/utils/llm/repositories/mistral/mistral.repository';

@Injectable()
export class AnalysisLlmService extends LlmService {
  constructor(mistral: MistralRepository, @Optional() observer?: LlmObserver) {
    super(mistral, observer);
  }
}
