import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { eq } from 'drizzle-orm';
import { pcaetDateSaisineTable } from '../shared/models/pcaet-date-saisine.table';

@Injectable()
export class AddDateSaisineRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async isTransmisHorsPlateforme(
    demarcheId: number,
    tx?: Transaction
  ): Promise<boolean> {
    const [demarche] = await (tx ?? this.databaseService.db)
      .select({ transmittedOffPlatform: demarcheTable.transmittedOffPlatform })
      .from(demarcheTable)
      .where(eq(demarcheTable.id, demarcheId))
      .limit(1);
    return demarche?.transmittedOffPlatform ?? false;
  }

  async insert(
    {
      demarcheId,
      dateSaisine,
      userId,
    }: { demarcheId: number; dateSaisine: string; userId: string },
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(pcaetDateSaisineTable)
      .values({ demarcheId, dateSaisine, createdBy: userId });
  }
}
