import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { and, eq, exists, inArray, isNotNull, lte, or, sql } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

/** Statuts d'où l'instruction peut encore se clore. */
const STATUTS_CLOSABLES = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
] as const;

@Injectable()
export class CloreInstructionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Les dossiers susceptibles de basculer en instruit : délai échu, **ou** au
   * moins un avis validé.
   *
   * Les deux conditions sont là à dessein. Ne garder que le délai rendrait la
   * passe aveugle au chemin « avis complets » : un dossier dont les avis sont
   * tous rendus, mais dont l'échéance est encore loin, ne serait jamais
   * réexaminé — la clôture n'aurait eu sa chance qu'à l'instant de la validation
   * du dernier avis, et un statut revenu en arrière depuis la lui ferait perdre.
   *
   * Le prédicat reste large exprès : il écarte le gros des dossiers sans
   * prétendre trancher. C'est `clore()` qui décide, sous verrou de ligne, et les
   * guards qui font autorité.
   */
  async listInstructionsAClore(
    now: Date,
    tx?: Transaction
  ): Promise<{ demarcheId: number; collectiviteId: number }[]> {
    const db = tx ?? this.databaseService.db;

    const aUnAvisValide = exists(
      db
        .select({ un: sql`1` })
        .from(pcaetDemandeAvisTable)
        .innerJoin(
          pcaetAvisTable,
          eq(pcaetAvisTable.demandeAvisId, pcaetDemandeAvisTable.id)
        )
        .where(
          and(
            eq(pcaetDemandeAvisTable.demarcheId, demarcheTable.id),
            isNotNull(pcaetAvisTable.valideLe)
          )
        )
    );

    const delaiEchu = and(
      isNotNull(demarcheTable.avisDeadlineAt),
      lte(demarcheTable.avisDeadlineAt, now.toISOString())
    );

    return db
      .select({
        demarcheId: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
      })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          inArray(demarcheTable.status, [...STATUTS_CLOSABLES]),
          // Jamais transmis : aucune instance n'a été saisie, il n'y a pas
          // d'instruction à clore.
          isNotNull(demarcheTable.transmittedAt),
          or(delaiEchu, aUnAvisValide)
        )
      );
  }
}
