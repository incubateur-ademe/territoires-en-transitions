import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { UtilsModule } from '../utils/utils.module';
import { NotionBugCreatorService } from './notion-bug-creator/notion-bug-creator.service';

@Module({
  imports: [ConfigurationModule, UtilsModule],
  providers: [NotionBugCreatorService],
  exports: [NotionBugCreatorService],
})
export class NotionModule {}
