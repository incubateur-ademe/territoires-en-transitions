import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '../../collectivites/collectivites.module';
import { AxesRouter } from './axes.router';
import { ListAxesRepository } from './list-axes/list-axes.repository';
import { ListAxesRouter } from './list-axes/list-axes.router';
import { ListAxesService } from './list-axes/list-axes.service';
import { MutateAxeRepository } from './mutate-axe/mutate-axe.repository';
import { MutateAxeRouter } from './mutate-axe/mutate-axe.router';
import { MutateAxeService } from './mutate-axe/mutate-axe.service';

@Module({
  imports: [forwardRef(() => CollectivitesModule)],
  providers: [
    MutateAxeService,
    MutateAxeRepository,
    MutateAxeRouter,
    ListAxesService,
    ListAxesRepository,
    ListAxesRouter,
    AxesRouter,
  ],
  exports: [AxesRouter],
})
export class AxeModule {}
