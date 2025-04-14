import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { SireneModule } from '../sirene/sirene.module';
import { UtilsModule } from '../utils/utils.module';
import { ConnectApiService } from './connect-api.service';
import { ConnectSynchroService } from './connect-synchro.service';

@Module({
  imports: [ConfigurationModule, UtilsModule, SireneModule],
  providers: [ConnectApiService, ConnectSynchroService],
  exports: [ConnectSynchroService],
})
export class ConnectModule {}
