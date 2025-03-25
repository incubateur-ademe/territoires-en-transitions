import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { NotionModule } from '../notion/notion.module';
import { CrispController } from './controllers/crisp.controller';
import { CrispService } from './services/crisp.service';

@Module({
  imports: [ConfigurationModule, NotionModule],
  controllers: [CrispController],
  providers: [CrispService],
})
export class CrispModule {}
