import { Injectable } from '@nestjs/common';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { reponseBinaireTable } from '@tet/backend/collectivites/personnalisations/models/reponse-binaire.table';
import { reponseChoixTable } from '@tet/backend/collectivites/personnalisations/models/reponse-choix.table';
import { reponseProportionTable } from '@tet/backend/collectivites/personnalisations/models/reponse-proportion.table';
import { collectiviteBanatic2025CompetenceTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-competence.table';
import { collectiviteBanatic2025TransfertTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-transfert.table';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  PersonnalisationReponsesPayload,
  PersonnalisationReponseValue,
} from '@tet/domain/collectivites';
import { and, eq, isNotNull, or, sql } from 'drizzle-orm';

type CompetenceSubquery = ReturnType<
  PersonnalisationReponsesEffectivesRepository['getCompetenceSubquery']
>;

@Injectable()
export class PersonnalisationReponsesEffectivesRepository {
  /**
   * Charge les réponses effectives (réponses explicites de la collectivité +
   * réponses déduites des compétences exercées).
   */
  async getReponsesEffectivesPayload(
    collectiviteId: number,
    tx: Transaction
  ): Promise<PersonnalisationReponsesPayload> {
    const competenceSubquery = this.getCompetenceSubquery(collectiviteId, tx);
    const reponseUnion = this.buildReponseUnionQuery(
      collectiviteId,
      competenceSubquery,
      tx
    ).as('reponseUnion');

    const rows = await tx
      .select({
        questionId: reponseUnion.questionId,
        value: reponseUnion.value,
      })
      .from(reponseUnion)
      .where(isNotNull(reponseUnion.value));

    const payload: PersonnalisationReponsesPayload = {};
    for (const row of rows) {
      payload[row.questionId] = row.value;
    }
    return payload;
  }

  getAnsweredQuestionIdsSubquery(collectiviteId: number, tx: Transaction) {
    const competenceSubquery = this.getCompetenceSubquery(collectiviteId, tx);
    const union = this.buildReponseUnionQuery(
      collectiviteId,
      competenceSubquery,
      tx
    );
    const reponseUnion = union.as('reponseUnion');
    return tx
      .select({ questionId: reponseUnion.questionId })
      .from(reponseUnion)
      .where(isNotNull(reponseUnion.value))
      .as('reponse');
  }

  getCompetenceSubquery(collectiviteId: number, tx: Transaction) {
    return tx
      .select({
        competenceCode: banatic2025CompetenceTable.competenceCode,
        competenceIntitule: banatic2025CompetenceTable.intitule,
        competenceExercee: collectiviteBanatic2025CompetenceTable.exercice,
        natureTransfert: collectiviteBanatic2025TransfertTable.natureTransfert,
      })
      .from(banatic2025CompetenceTable)
      .leftJoin(
        collectiviteBanatic2025CompetenceTable,
        and(
          eq(
            collectiviteBanatic2025CompetenceTable.collectiviteId,
            collectiviteId
          ),
          eq(
            collectiviteBanatic2025CompetenceTable.competenceCode,
            banatic2025CompetenceTable.competenceCode
          )
        )
      )
      .leftJoin(
        collectiviteBanatic2025TransfertTable,
        and(
          eq(
            collectiviteBanatic2025TransfertTable.collectiviteId,
            collectiviteId
          ),
          eq(
            collectiviteBanatic2025TransfertTable.competenceCode,
            banatic2025CompetenceTable.competenceCode
          )
        )
      )
      .as('competence');
  }

  /**
   * UNION des réponses (binaire avec compétence Banatic, choix, proportion).
   * cast toutes les réponses en jsonb pour que l'UNION fonctionne
   */
  private buildReponseUnionQuery(
    collectiviteId: number,
    competenceSubquery: CompetenceSubquery,
    tx: Transaction
  ) {
    return tx
      .select({
        questionId: questionTable.id,
        value:
          sql<PersonnalisationReponseValue>`to_jsonb(coalesce(${reponseBinaireTable.reponse}, ${competenceSubquery.competenceExercee}))`.as(
            'value'
          ),
      })
      .from(questionTable)
      .leftJoin(
        reponseBinaireTable,
        and(
          eq(reponseBinaireTable.questionId, questionTable.id),
          eq(reponseBinaireTable.collectiviteId, collectiviteId)
        )
      )
      .leftJoin(
        competenceSubquery,
        eq(competenceSubquery.competenceCode, questionTable.competenceCode)
      )
      .where(
        and(
          eq(questionTable.type, 'binaire'),
          or(
            isNotNull(reponseBinaireTable.questionId),
            isNotNull(competenceSubquery.competenceExercee)
          )
        )
      )
      .union(
        tx
          .select({
            questionId: reponseChoixTable.questionId,
            value:
              sql<PersonnalisationReponseValue>`to_jsonb(nullif(${reponseChoixTable.reponse}, ''))`.as(
                'value'
              ),
          })
          .from(reponseChoixTable)
          .where(eq(reponseChoixTable.collectiviteId, collectiviteId))
      )
      .union(
        tx
          .select({
            questionId: reponseProportionTable.questionId,
            value:
              sql<PersonnalisationReponseValue>`to_jsonb(${reponseProportionTable.reponse})`.as(
                'value'
              ),
          })
          .from(reponseProportionTable)
          .where(eq(reponseProportionTable.collectiviteId, collectiviteId))
      );
  }
}
