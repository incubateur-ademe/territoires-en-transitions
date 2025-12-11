import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { UpsertAxeBaseRepository } from './upsert-axe-base.repository';
import { UpsertAxeError, UpsertAxeErrorEnum } from './upsert-axe.errors';
import { CreateAxeInput, UpdateAxeInput } from './upsert-axe.input';

@Injectable()
export class UpsertAxeRepository extends UpsertAxeBaseRepository<
  CreateAxeInput,
  UpdateAxeInput,
  UpsertAxeError
> {
  protected readonly logger = new Logger(UpsertAxeRepository.name);

  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  protected getCreateError(): UpsertAxeError {
    return UpsertAxeErrorEnum.CREATE_AXE_ERROR;
  }

  protected getUpdateError(): UpsertAxeError {
    return UpsertAxeErrorEnum.UPDATE_AXE_ERROR;
  }
}
