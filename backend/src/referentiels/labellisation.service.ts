import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, isNotNull, SQL, SQLWrapper } from 'drizzle-orm';
import { GetReferentielService } from './get-referentiel/get-referentiel.service';
import { ReferentielId } from './index-domain';
import {
  labellisationAuditTable,
  LabellisationAuditType,
} from './models/labellisation-audit.table';
import {
  labellisationEtoileMetaTable,
  LabellisationEtoileMetaType,
} from './models/labellisation-etoile.table';

@Injectable()
export class LabellisationService {
  private readonly logger = new Logger(LabellisationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly referentielsService: GetReferentielService
  ) {}

  async getEtoileDefinitions(): Promise<LabellisationEtoileMetaType[]> {
    this.logger.log(`Getting etoile definitions`);

    const etoileDefinitions = await this.databaseService.db
      .select()
      .from(labellisationEtoileMetaTable)
      .orderBy(desc(labellisationEtoileMetaTable.minRealisePercentage));

    return etoileDefinitions;
  }

  async getAuditsForCollectivite(
    collectiviteId: number,
    referentiel: ReferentielId,
    onlyEnded = false
  ): Promise<LabellisationAuditType[]> {
    const filter: (SQLWrapper | SQL)[] = [
      eq(labellisationAuditTable.collectiviteId, collectiviteId),
      eq(labellisationAuditTable.referentiel, referentiel),
    ];
    if (onlyEnded) {
      filter.push(isNotNull(labellisationAuditTable.dateFin));
    }

    const audits = await this.databaseService.db
      .select()
      .from(labellisationAuditTable)
      .where(and(...filter))
      .orderBy(desc(labellisationAuditTable.dateDebut));
    this.logger.log(
      `Found ${audits.length} audits for collectivite ${collectiviteId} and referentiel ${referentiel}`
    );
    return audits;
  }
}
