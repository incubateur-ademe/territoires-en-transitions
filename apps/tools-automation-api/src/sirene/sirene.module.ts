import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { UtilsModule } from '../utils/utils.module';
import { SireneService } from './sirene.service';

@Module({
  imports: [ConfigurationModule, UtilsModule],
  providers: [SireneService],
  exports: [SireneService],
})
export class SireneModule {}
