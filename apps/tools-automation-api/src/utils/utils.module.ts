import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { TrpcClientService } from './trpc/trpc-client.service';
import { VersionController } from './version/version.controller';

@Module({
  imports: [ConfigurationModule],
  controllers: [VersionController],
  providers: [TrpcClientService],
})
export class UtilsModule {}
