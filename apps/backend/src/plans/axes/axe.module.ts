import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '../../collectivites/collectivites.module';
import { MutateAxeRepository } from './mutate-axe/mutate-axe.repository';
import { MutateAxeRouter } from './mutate-axe/mutate-axe.router';
import { MutateAxeService } from './mutate-axe/mutate-axe.service';

@Module({
  imports: [forwardRef(() => CollectivitesModule)],
  providers: [MutateAxeService, MutateAxeRepository, MutateAxeRouter],
  exports: [MutateAxeRouter],
})
export class AxeModule {}
