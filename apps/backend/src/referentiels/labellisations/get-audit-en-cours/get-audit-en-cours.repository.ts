import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { auditTable } from '../audit.table';

interface GetAuditEnCoursInput {
  collectiviteId: number;
  referentielId: string;
}

@Injectable()
export class GetAuditEnCoursRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async execute({ collectiviteId, referentielId }: GetAuditEnCoursInput) {
    const [auditEnCours] = await this.databaseService.db
      .select()
      .from(auditTable)
      .where(
        and(
          eq(auditTable.collectiviteId, collectiviteId),
          eq(auditTable.referentielId, referentielId as any),
          eq(auditTable.clos, false)
        )
      )
      .orderBy(auditTable.dateDebut)
      .limit(1);

    if (!auditEnCours) {
      throw new Error(
        `Aucun audit en cours trouvé pour la collectivité ${collectiviteId} et le référentiel ${referentielId}`
      );
    }

    return auditEnCours;
  }
}
