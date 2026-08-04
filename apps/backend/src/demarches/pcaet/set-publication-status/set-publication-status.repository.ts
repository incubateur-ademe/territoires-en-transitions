import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetPublicationStatusEnum,
  type DemarchePcaetPublicationStatus,
} from '@tet/domain/demarches';
import { and, eq } from 'drizzle-orm';
import type { DemarchePcaetRef } from '../shared/demarche-pcaet-ref.repository';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

@Injectable()
export class SetPublicationStatusRepository {
  private readonly logger = new Logger(SetPublicationStatusRepository.name);

  async updatePublicationStatus(
    ref: Pick<DemarchePcaetRef, 'id' | 'collectiviteId'>,
    publicationStatus: DemarchePcaetPublicationStatus,
    userId: string,
    tx: Transaction
  ): Promise<Result<undefined, 'DATABASE_ERROR'>> {
    try {
      await tx
        .update(demarcheTable)
        .set({
          publicationStatus,
          publishedAt:
            publicationStatus === DemarchePcaetPublicationStatusEnum.PUBLISHED
              ? new Date().toISOString()
              : null,
          modifiedAt: new Date().toISOString(),
          modifiedBy: userId,
        })
        .where(
          and(
            eq(demarcheTable.id, ref.id),
            eq(demarcheTable.collectiviteId, ref.collectiviteId)
          )
        );
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Error updating publication status of demarche PCAET ${ref.id}: ${error}`
      );
      return failure('DATABASE_ERROR');
    }
  }
}
