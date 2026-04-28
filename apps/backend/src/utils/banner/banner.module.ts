import { Module } from '@nestjs/common';
import { UsersModule } from '@tet/backend/users/users.module';
import { BannerRouter } from './banner.router';
import { BannerService } from './banner.service';

@Module({
  imports: [UsersModule],
  providers: [BannerService, BannerRouter],
  exports: [BannerRouter],
})
export class BannerModule {}
