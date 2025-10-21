import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, getTableColumns, lte, sql } from 'drizzle-orm';
import { Audit, auditTable } from './audit.table';
import { etoileActionConditionDefinitionTable } from './etoile-action-condition-definition.table';
import {
  Etoile,
  EtoileDefinition,
  etoileDefinitionTable,
} from './etoile-definition.table';

@Injectable()
export class LabellisationService {
  private readonly logger = new Logger(LabellisationService.name);

  constructor(
    private readonly databaseService: DatabaseService // private readonly snapshotsService: SnapshotsService
  ) {}

  private readonly db = this.databaseService.db;

  async getEtoileDefinitions(): Promise<EtoileDefinition[]> {
    return this.db
      .select({
        ...getTableColumns(etoileDefinitionTable),
        etoile: etoileDefinitionTable.etoile,
      })
      .from(etoileDefinitionTable)
      .orderBy(desc(etoileDefinitionTable.minRealisePercentage));
  }

  async listActionConditionDefinitions({
    referentielId,
    etoileCible,
  }: {
    referentielId: ReferentielId;
    etoileCible: Etoile;
  }) {
    // Pour une même `actionId`, il peut exister plusieurs conditions, chacune liée à un nombre d'étoiles différentes.
    // Or, pour chaque `actionId`, on veut uniquement la condition liée à la plus grande étoile
    // (et se trouvant par ailleurs inférieure ou égale à `etoileCible`)
    const listWithMaxEtoileByActionId = this.db
      .select({
        ...getTableColumns(etoileActionConditionDefinitionTable),
        maxEtoile:
          sql`MAX(${etoileActionConditionDefinitionTable.etoile}::varchar::integer)
            OVER (PARTITION BY ${etoileActionConditionDefinitionTable.actionId})`.as<Etoile>(
            'maxEtoile'
          ),
      })
      .from(etoileActionConditionDefinitionTable)
      .where(
        and(
          eq(etoileActionConditionDefinitionTable.referentielId, referentielId),
          lte(
            sql`${etoileActionConditionDefinitionTable.etoile}::varchar::integer`,
            etoileCible
          )
        )
      );

    const subQuery = this.db
      .$with('ranked_conditions')
      .as(listWithMaxEtoileByActionId);

    const query = this.db
      .with(subQuery)
      .select({
        etoile: subQuery.etoile,
        prio: subQuery.priorite,
        referentiel: subQuery.referentielId,
        actionId: subQuery.actionId,
        formulation: subQuery.formulation,
        minRealisePercentage: subQuery.minRealisePercentage,
        minProgrammePercentage: subQuery.minProgrammePercentage,
      })
      .from(subQuery)
      .where(eq(sql`${subQuery.etoile}::varchar::integer`, subQuery.maxEtoile));

    return query;
  }

  async listAudits({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }): Promise<Audit[]> {
    const filter = [
      eq(auditTable.collectiviteId, collectiviteId),
      eq(auditTable.referentielId, referentielId),
    ];

    const audits = await this.databaseService.db
      .select()
      .from(auditTable)
      .where(and(...filter))
      .orderBy(desc(auditTable.dateDebut));

    this.logger.log(
      `Found ${audits.length} audits for collectivite ${collectiviteId} and referentiel ${referentielId}`
    );

    return audits;
  }
}
