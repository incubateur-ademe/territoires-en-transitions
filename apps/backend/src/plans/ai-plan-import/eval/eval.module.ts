import { Module } from '@nestjs/common';
import { ConfigurationModule } from '@tet/backend/utils/config/configuration.module';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';

/** Le strict nécessaire pour faire tourner le pipeline : ni base, ni file. */
@Module({
  imports: [ConfigurationModule, LlmModule],
})
export class EvalModule {}
