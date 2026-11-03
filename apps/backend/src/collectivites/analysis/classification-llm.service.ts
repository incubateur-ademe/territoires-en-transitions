import { Injectable, Optional } from '@nestjs/common';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { LlmObserver } from '@tet/backend/utils/llm/llm-observer';
import { AnthropicRepository } from '@tet/backend/utils/llm/repositories/anthropic/anthropic.repository';

@Injectable()
export class ClassificationLlmService extends LlmService {
  constructor(anthropic: AnthropicRepository, @Optional() observer?: LlmObserver) {
    super(anthropic, observer);
  }
}
