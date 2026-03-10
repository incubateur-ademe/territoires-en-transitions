import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { historiqueJustificationTable } from '../models/historique-justification.table';
import { historiqueReponseBinaireTable } from '../models/historique-reponse-binaire.table';
import { historiqueReponseChoixTable } from '../models/historique-reponse-choix.table';
import { historiqueReponseProportionTable } from '../models/historique-reponse-proportion.table';

export type ReponseBinaireSnapshot = {
  collectiviteId: number;
  questionId: string;
  reponse: boolean | null;
  modifiedAt: string;
};

export type ReponseChoixSnapshot = {
  collectiviteId: number;
  questionId: string;
  reponse: string | null;
  modifiedAt: string;
};

export type ReponseProportionSnapshot = {
  collectiviteId: number;
  questionId: string;
  reponse: number | null;
  modifiedAt: string;
};

export type JustificationSnapshot = {
  collectiviteId: number;
  questionId: string;
  texte: string;
  modifiedAt: string;
  modifiedBy: string | null;
};

@Injectable()
export class SetPersonnalisationReponseHistoriqueRepository {
  async saveReponseBinaire(
    tx: Transaction,
    newRow: ReponseBinaireSnapshot,
    oldRow: ReponseBinaireSnapshot | null,
    userId: string | null
  ): Promise<void> {
    const modifiedByCondition = userId
      ? eq(historiqueReponseBinaireTable.modifiedBy, userId)
      : isNull(historiqueReponseBinaireTable.modifiedBy);

    const recentHistory = await tx
      .select({ id: historiqueReponseBinaireTable.id })
      .from(historiqueReponseBinaireTable)
      .where(
        and(
          eq(
            historiqueReponseBinaireTable.collectiviteId,
            newRow.collectiviteId
          ),
          eq(historiqueReponseBinaireTable.questionId, newRow.questionId),
          modifiedByCondition,
          gt(
            historiqueReponseBinaireTable.modifiedAt,
            sql`${newRow.modifiedAt}::timestamptz - interval '1 hour'`
          )
        )
      )
      .orderBy(desc(historiqueReponseBinaireTable.modifiedAt))
      .limit(1);

    if (recentHistory.length > 0) {
      await tx
        .update(historiqueReponseBinaireTable)
        .set({
          reponse: newRow.reponse,
          modifiedAt: newRow.modifiedAt,
        })
        .where(eq(historiqueReponseBinaireTable.id, recentHistory[0].id));
      return;
    }

    await tx.insert(historiqueReponseBinaireTable).values({
      collectiviteId: newRow.collectiviteId,
      questionId: newRow.questionId,
      reponse: newRow.reponse,
      previousReponse: oldRow?.reponse ?? null,
      modifiedBy: userId,
      modifiedAt: newRow.modifiedAt,
    });
  }

  async saveReponseChoix(
    tx: Transaction,
    newRow: ReponseChoixSnapshot,
    oldRow: ReponseChoixSnapshot | null,
    userId: string | null
  ): Promise<void> {
    const modifiedByCondition = userId
      ? eq(historiqueReponseChoixTable.modifiedBy, userId)
      : isNull(historiqueReponseChoixTable.modifiedBy);

    const recentHistory = await tx
      .select({ id: historiqueReponseChoixTable.id })
      .from(historiqueReponseChoixTable)
      .where(
        and(
          eq(historiqueReponseChoixTable.collectiviteId, newRow.collectiviteId),
          eq(historiqueReponseChoixTable.questionId, newRow.questionId),
          modifiedByCondition,
          gt(
            historiqueReponseChoixTable.modifiedAt,
            sql`${newRow.modifiedAt}::timestamptz - interval '1 hour'`
          )
        )
      )
      .orderBy(desc(historiqueReponseChoixTable.modifiedAt))
      .limit(1);

    if (recentHistory.length > 0) {
      await tx
        .update(historiqueReponseChoixTable)
        .set({
          reponse: newRow.reponse,
          modifiedAt: newRow.modifiedAt,
        })
        .where(eq(historiqueReponseChoixTable.id, recentHistory[0].id));
      return;
    }

    await tx.insert(historiqueReponseChoixTable).values({
      collectiviteId: newRow.collectiviteId,
      questionId: newRow.questionId,
      reponse: newRow.reponse,
      previousReponse: oldRow?.reponse ?? null,
      modifiedBy: userId,
      modifiedAt: newRow.modifiedAt,
    });
  }

  async saveReponseProportion(
    tx: Transaction,
    newRow: ReponseProportionSnapshot,
    oldRow: ReponseProportionSnapshot | null,
    userId: string | null
  ): Promise<void> {
    const modifiedByCondition = userId
      ? eq(historiqueReponseProportionTable.modifiedBy, userId)
      : isNull(historiqueReponseProportionTable.modifiedBy);

    const recentHistory = await tx
      .select({ id: historiqueReponseProportionTable.id })
      .from(historiqueReponseProportionTable)
      .where(
        and(
          eq(
            historiqueReponseProportionTable.collectiviteId,
            newRow.collectiviteId
          ),
          eq(historiqueReponseProportionTable.questionId, newRow.questionId),
          modifiedByCondition,
          gt(
            historiqueReponseProportionTable.modifiedAt,
            sql`${newRow.modifiedAt}::timestamptz - interval '1 hour'`
          )
        )
      )
      .orderBy(desc(historiqueReponseProportionTable.modifiedAt))
      .limit(1);

    if (recentHistory.length > 0) {
      await tx
        .update(historiqueReponseProportionTable)
        .set({
          reponse: newRow.reponse,
          modifiedAt: newRow.modifiedAt,
        })
        .where(eq(historiqueReponseProportionTable.id, recentHistory[0].id));
      return;
    }

    await tx.insert(historiqueReponseProportionTable).values({
      collectiviteId: newRow.collectiviteId,
      questionId: newRow.questionId,
      reponse: newRow.reponse,
      previousReponse: oldRow?.reponse ?? null,
      modifiedBy: userId,
      modifiedAt: newRow.modifiedAt,
    });
  }

  async saveJustification(
    tx: Transaction,
    newRow: JustificationSnapshot,
    oldRow: JustificationSnapshot | null,
    userId: string | null
  ): Promise<void> {
    const modifiedByCondition = userId
      ? eq(historiqueJustificationTable.modifiedBy, userId)
      : isNull(historiqueJustificationTable.modifiedBy);

    const recentHistory = await tx
      .select({ id: historiqueJustificationTable.id })
      .from(historiqueJustificationTable)
      .where(
        and(
          eq(
            historiqueJustificationTable.collectiviteId,
            newRow.collectiviteId
          ),
          eq(historiqueJustificationTable.questionId, newRow.questionId),
          modifiedByCondition,
          gt(
            historiqueJustificationTable.modifiedAt,
            sql`${newRow.modifiedAt}::timestamptz - interval '1 hour'`
          )
        )
      )
      .orderBy(desc(historiqueJustificationTable.modifiedAt))
      .limit(1);

    if (recentHistory.length > 0) {
      await tx
        .update(historiqueJustificationTable)
        .set({
          texte: newRow.texte,
          modifiedAt: newRow.modifiedAt,
        })
        .where(eq(historiqueJustificationTable.id, recentHistory[0].id));
      return;
    }

    await tx.insert(historiqueJustificationTable).values({
      collectiviteId: newRow.collectiviteId,
      questionId: newRow.questionId,
      texte: newRow.texte,
      previousTexte: oldRow?.texte ?? null,
      modifiedBy: userId,
      previousModifiedBy: oldRow?.modifiedBy ?? null,
      modifiedAt: newRow.modifiedAt,
      previousModifiedAt: oldRow?.modifiedAt ?? null,
    });
  }
}
