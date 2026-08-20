import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DEMARCHE_PCAET_ACTIVE_STATUSES,
  DemarcheTypeEnum,
  type DemarchePcaetObligation,
} from '@tet/domain/demarches';
import { and, eq, inArray } from 'drizzle-orm';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

export type InsertDemarchePcaetValues = {
  collectiviteId: number;
  titre: string;
  description: string;
  obligation?: DemarchePcaetObligation;
  launchedAt: string | null;
};

@Injectable()
export class CreateDemarchePcaetRepository {
  private readonly logger = new Logger(CreateDemarchePcaetRepository.name);

  /** Une démarche « en cours » existe-t-elle déjà pour la collectivité ? */
  async hasActiveDemarche(
    collectiviteId: number,
    tx: Transaction
  ): Promise<boolean> {
    const rows = await tx
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          inArray(demarcheTable.status, [...DEMARCHE_PCAET_ACTIVE_STATUSES])
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  async insertDemarche(
    values: InsertDemarchePcaetValues,
    userId: string,
    tx: Transaction
  ): Promise<
    Result<
      { id: number },
      'CREATE_DEMARCHE_PCAET_ERROR' | 'DEMARCHE_EN_COURS_EXISTANTE'
    >
  > {
    try {
      const [inserted] = await tx
        .insert(demarcheTable)
        .values({
          collectiviteId: values.collectiviteId,
          type: DemarcheTypeEnum.PCAET,
          titre: values.titre,
          description: values.description,
          obligation: values.obligation,
          launchedAt: values.launchedAt,
          createdBy: userId,
          modifiedBy: userId,
        })
        .returning({ id: demarcheTable.id });
      return success(inserted);
    } catch (error) {
      // Course entre deux créations : l'index unique partiel
      // demarche_active_unique tranche en dernier ressort.
      if (String(error).includes('demarche_active_unique')) {
        return failure('DEMARCHE_EN_COURS_EXISTANTE');
      }
      this.logger.error(
        `Error creating demarche PCAET for collectivite ${values.collectiviteId}: ${error}`
      );
      return failure('CREATE_DEMARCHE_PCAET_ERROR');
    }
  }
}
