import { DatabaseService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ReferentielId } from '../../models/referentiel-id.enum';
import { Audit, auditTable } from '../audit.table';

interface GetAuditEnCoursInput {
  collectiviteId: number;
  referentielId: ReferentielId;
}

@Injectable()
export class GetAuditEnCoursRepository {
  db = this.databaseService.db;

  constructor(private readonly databaseService: DatabaseService) {}

  async execute({
    collectiviteId,
    referentielId,
  }: GetAuditEnCoursInput): Promise<Audit> {
    const [audit] = await this.db
      .select()
      .from(auditTable)
      .where(
        and(
          eq(auditTable.collectiviteId, collectiviteId),
          eq(auditTable.referentielId, referentielId),
          eq(auditTable.clos, false)
        )
      )
      .orderBy(auditTable.dateDebut)
      .limit(1);

    if (!audit) {
      throw new Error(
        `Aucun audit en cours trouvé pour la collectivité ${collectiviteId} et le référentiel ${referentielId}`
      );
    }

    return audit;
  }
}
