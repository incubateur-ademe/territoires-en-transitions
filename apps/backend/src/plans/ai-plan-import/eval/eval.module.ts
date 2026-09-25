import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@tet/backend/utils/config/configuration';
import { ConfigurationModule } from '@tet/backend/utils/config/configuration.module';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';

/**
 * Le strict nécessaire pour faire tourner le pipeline : ni base, ni file. La
 * config passe par le même schéma que l'app, sinon ses valeurs par défaut
 * (appels simultanés, modèles des paliers) manquent.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration] }),
    ConfigurationModule,
    LlmModule,
  ],
})
export class EvalModule {}
