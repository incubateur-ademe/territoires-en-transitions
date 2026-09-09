import { Injectable } from '@nestjs/common';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { ReferentielId } from '@tet/domain/referentiels';
import { eq } from 'drizzle-orm';

type AuditPermissionContext = {
  collectiviteId: number;
  referentielId: ReferentielId;
};

@Injectable()
export class PermissionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAuditPermissionContext(
    auditId: number,
    tx?: Transaction
  ): Promise<AuditPermissionContext | null> {
    const [audit] = await (tx ?? this.databaseService.db)
      .select({
        collectiviteId: auditTable.collectiviteId,
        referentielId: auditTable.referentielId,
      })
      .from(auditTable)
      .where(eq(auditTable.id, auditId))
      .limit(1);

    if (!audit) {
      return null;
    }

    return {
      collectiviteId: audit.collectiviteId,
      referentielId: audit.referentielId as ReferentielId,
    };
  }
}
