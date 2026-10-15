import { Module } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { AlbertRepository } from './repositories/albert/albert.repository';
import { GeminiRepository } from './repositories/gemini/gemini.repository';
import { LlmRepository } from './repositories/llm.repository';
import { MistralRepository } from './repositories/mistral/mistral.repository';
import { LlmService } from './llm.service';
import { LlmObserver, LoggingLlmObserver } from './llm-observer';

@Module({
  providers: [
    LlmService,
    { provide: LlmObserver, useClass: LoggingLlmObserver },
    GeminiRepository,
    AlbertRepository,
    MistralRepository,
    {
      provide: LlmRepository,
      inject: [ConfigurationService, GeminiRepository, AlbertRepository],
      useFactory: (
        configService: ConfigurationService,
        gemini: GeminiRepository,
        albert: AlbertRepository
      ): LlmRepository =>
        configService.get('LLM_PROVIDER') === 'albert' ? albert : gemini,
    },
  ],
  exports: [LlmService, LlmObserver, MistralRepository],
})
export class LlmModule {}
