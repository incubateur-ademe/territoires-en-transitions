import { Module } from '@nestjs/common';
import { UsersModule } from '@tet/backend/users/users.module';
import { ListCollectivitesRouter } from './list-collectivites/list-collectivites.router';
import { ListCollectivitesService } from './list-collectivites/list-collectivites.service';
import { RepriseTecRouter } from './reprise-tec.router';

@Module({
  imports: [UsersModule],
  providers: [
    ListCollectivitesService,
    ListCollectivitesRouter,
    RepriseTecRouter,
  ],
  exports: [RepriseTecRouter],
})
export class RepriseTecModule {}
