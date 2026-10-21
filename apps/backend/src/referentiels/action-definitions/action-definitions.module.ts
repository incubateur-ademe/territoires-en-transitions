import { Module } from '@nestjs/common';
import { CollectivitesCoreModule } from '@tet/backend/collectivites/collectivites-core.module';
import { ActionDefinitionsRepository } from './action-definitions.repository';
import { RenderActionTextsService } from './render-action-texts.service';

@Module({
  imports: [CollectivitesCoreModule],
  providers: [ActionDefinitionsRepository, RenderActionTextsService],
  exports: [ActionDefinitionsRepository, RenderActionTextsService],
})
export class ActionDefinitionsModule {}
