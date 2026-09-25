import { Module } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { AlbertRepository } from './repositories/albert/albert.repository';
import { GeminiRepository } from './repositories/gemini/gemini.repository';
import { LlmRepository } from './repositories/llm.repository';
import { LlmService } from './llm.service';

@Module({
  providers: [
    LlmService,
    GeminiRepository,
    AlbertRepository,
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
  exports: [LlmService],
})
export class LlmModule {}
