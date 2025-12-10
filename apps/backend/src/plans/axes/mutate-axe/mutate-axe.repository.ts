import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { MutateAxeBaseRepository } from './mutate-axe-base.repository';
import { MutateAxeError, MutateAxeErrorEnum } from './mutate-axe.errors';
import { CreateAxeInput, UpdateAxeInput } from './mutate-axe.input';

@Injectable()
export class MutateAxeRepository extends MutateAxeBaseRepository<
  CreateAxeInput,
  UpdateAxeInput,
  MutateAxeError
> {
  protected readonly logger = new Logger(MutateAxeRepository.name);

  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  protected getCreateError(): MutateAxeError {
    return MutateAxeErrorEnum.CREATE_AXE_ERROR;
  }

  protected getUpdateError(): MutateAxeError {
    return MutateAxeErrorEnum.UPDATE_AXE_ERROR;
  }
}
