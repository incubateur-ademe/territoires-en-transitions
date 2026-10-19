import {
  DynamicModule,
  FactoryProvider,
  Module,
  ModuleMetadata,
} from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RuntimeHealthController } from './runtime-health.controller';
import {
  HEALTH_DEPENDENCIES,
  HealthDependencies,
  RuntimeHealthService,
} from './runtime-health.service';

type HealthModuleOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<HealthDependencies>, 'inject' | 'useFactory'>;

@Module({})
export class RuntimeHealthModule {
  static registerAsync(options: HealthModuleOptions): DynamicModule {
    return {
      module: RuntimeHealthModule,
      imports: [
        TerminusModule.forRoot({ logger: false }),
        ...(options.imports ?? []),
      ],
      controllers: [RuntimeHealthController],
      providers: [
        {
          provide: HEALTH_DEPENDENCIES,
          inject: options.inject,
          useFactory: options.useFactory,
        },
        RuntimeHealthService,
      ],
    };
  }
}
