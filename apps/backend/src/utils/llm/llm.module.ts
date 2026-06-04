import { Module } from '@nestjs/common';
import { GeminiRepository } from './gemini.repository';
import { LlmRepository } from './llm.repository';
import { LlmService } from './llm.service';

@Module({
  providers: [
    LlmService,
    { provide: LlmRepository, useClass: GeminiRepository },
  ],
  exports: [LlmService],
})
export class LlmModule {}
