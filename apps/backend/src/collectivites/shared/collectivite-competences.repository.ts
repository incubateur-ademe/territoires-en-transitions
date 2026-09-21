import { Injectable } from '@nestjs/common';
import { collectiviteBanatic2025CompetenceTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-competence.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq } from 'drizzle-orm';

/**
 * Lecture des compétences Banatic (millésime 2025) d'une collectivité.
 *
 * Jusqu'ici les compétences n'étaient lues que par la sous-requête de
 * personnalisation (`PersonnalisationReponsesEffectivesRepository`), qui les
 * croise avec les transferts et le périmètre pour déduire une compétence
 * *effectivement* exercée. Cette règle-là ne se transpose pas : elle bascule à
 * « non » quand toutes les communes membres ont délégué la compétence à un
 * groupement, ce qui n'a aucun sens pour une compétence portée à l'échelle de
 * l'intercommunalité comme le SCOT. On s'en tient donc à l'exercice déclaré.
 */
@Injectable()
export class CollectiviteCompetencesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async hasCompetence(
    collectiviteId: number,
    competenceCode: number,
    tx?: Transaction
  ): Promise<boolean> {
    const [competence] = await (tx ?? this.databaseService.db)
      .select({ exercice: collectiviteBanatic2025CompetenceTable.exercice })
      .from(collectiviteBanatic2025CompetenceTable)
      .where(
        and(
          eq(
            collectiviteBanatic2025CompetenceTable.collectiviteId,
            collectiviteId
          ),
          eq(
            collectiviteBanatic2025CompetenceTable.competenceCode,
            competenceCode
          ),
          eq(collectiviteBanatic2025CompetenceTable.exercice, true)
        )
      )
      .limit(1);

    return competence !== undefined;
  }
}
