import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  IndicateurValeur,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { isNull, sql } from 'drizzle-orm';
import { groupBy } from 'es-toolkit';
import { indicateurValeurTable } from './indicateur-valeur.table';

type ValeurFields = 'both' | 'objectif' | 'resultat';

const valeurFields = (valeur: IndicateurValeurCreate): ValeurFields =>
  valeur.resultat !== undefined && valeur.objectif !== undefined
    ? 'both'
    : valeur.resultat !== undefined
    ? 'resultat'
    : 'objectif';

@Injectable()
export class UpsertGridValeursRepository {
  async upsert(
    valeurs: IndicateurValeurCreate[],
    tx: Transaction
  ): Promise<IndicateurValeur[]> {
    const sortedValeurs = valeurs.toSorted(
      (left, right) =>
        left.indicateurId - right.indicateurId ||
        left.collectiviteId - right.collectiviteId ||
        left.dateValeur.localeCompare(right.dateValeur)
    );
    const valeursByFields = groupBy(sortedValeurs, valeurFields);
    const result: IndicateurValeur[] = [];

    for (const valeursWithSameFields of Object.values(valeursByFields)) {
      const first = valeursWithSameFields[0];
      if (!first) continue;

      const saved = await tx
        .insert(indicateurValeurTable)
        .values(valeursWithSameFields)
        .onConflictDoUpdate({
          target: [
            indicateurValeurTable.indicateurId,
            indicateurValeurTable.collectiviteId,
            indicateurValeurTable.dateValeur,
            indicateurValeurTable.periodicite,
          ],
          targetWhere: isNull(indicateurValeurTable.metadonneeId),
          set: {
            ...(first.resultat !== undefined && {
              resultat: sql.raw(
                `excluded.${indicateurValeurTable.resultat.name}`
              ),
            }),
            ...(first.objectif !== undefined && {
              objectif: sql.raw(
                `excluded.${indicateurValeurTable.objectif.name}`
              ),
            }),
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
            modifiedBy: sql.raw(
              `excluded.${indicateurValeurTable.modifiedBy.name}`
            ),
            modifiedAt: sql.raw(
              `excluded.${indicateurValeurTable.modifiedAt.name}`
            ),
          },
        })
        .returning();

      if (saved.length !== valeursWithSameFields.length) {
        throw new Error(
          `Échec de l'écriture d'un lot de ${valeursWithSameFields.length} valeurs d'indicateur`
        );
      }
      result.push(...saved);
    }

    return result;
  }
}
