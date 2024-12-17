import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { NotionBugCreatorService } from './notion-bug-creator/notion-bug-creator.service';

@Module({
  imports: [ConfigurationModule],
  providers: [NotionBugCreatorService],
  exports: [NotionBugCreatorService],
})
export class NotionModule {}
