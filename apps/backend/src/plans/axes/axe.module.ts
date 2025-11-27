import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '../../collectivites/collectivites.module';
import { AxesRouter } from './axes.router';
import { DeleteAxeRepository } from './delete-axe/delete-axe.repository';
import { DeleteAxeRouter } from './delete-axe/delete-axe.router';
import { DeleteAxeService } from './delete-axe/delete-axe.service';
import { GetAxeRepository } from './get-axe/get-axe.repository';
import { GetAxeRouter } from './get-axe/get-axe.router';
import { GetAxeService } from './get-axe/get-axe.service';
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
    GetAxeService,
    GetAxeRepository,
    GetAxeRouter,
    DeleteAxeService,
    DeleteAxeRepository,
    DeleteAxeRouter,
    AxesRouter,
  ],
  exports: [AxesRouter],
})
export class AxeModule {}
