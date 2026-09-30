import { Module } from '@nestjs/common';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { VersionController } from '@tet/backend/utils/version/version.controller';
import VersionService from '@tet/backend/utils/version/version.service';
import { ConfigurationModule } from '../config/configuration.module';
import { TrpcClientService } from './trpc/trpc-client.service';

@Module({
  imports: [ConfigurationModule],
  controllers: [VersionController],
  providers: [
    TrpcClientService,
    ContextStoreService,
    VersionService,
  ],
  exports: [
    TrpcClientService,
    ContextStoreService,
  ],
})
export class UtilsModule {}
