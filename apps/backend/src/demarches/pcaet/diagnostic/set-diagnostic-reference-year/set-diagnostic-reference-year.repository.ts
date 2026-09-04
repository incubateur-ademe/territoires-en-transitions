import { Injectable } from '@nestjs/common';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { inArray, sql } from 'drizzle-orm';

const dateValeurForYear = (year: number): string => `${year}-01-01`;

@Injectable()
export class SetDiagnosticReferenceYearRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Bascule les valeurs d'un tableau du diagnostic d'une année de référence sur
   * une autre, en une seule requête : la CTE `basculees` retire les lignes de
   * l'année quittée et les rend, le `insert` les repose sur la nouvelle année.
   *
   * Le tout dans un seul ordre SQL parce que le déplacement n'est pas atomique
   * autrement : `unique_indicateur_valeur_importee` refuse deux lignes sur
   * (indicateur, collectivité, date, métadonnée), un simple `update` de
   * `date_valeur` casserait donc dès que l'année visée porte déjà une saisie.
   * Ici, cette collision est résolue par le `on conflict`, qui écrase la ligne
   * en place avec les valeurs basculées — la colonne affichée reste la vérité.
   *
   * @returns le nombre de valeurs déplacées
   */
  async moveValeursToYear(
    {
      collectiviteId,
      metadonneeId,
      indicateurIds,
      fromYear,
      toYear,
      userId,
    }: {
      collectiviteId: number;
      metadonneeId: number;
      indicateurIds: number[];
      fromYear: number;
      toYear: number;
      userId: string;
    },
    tx?: Transaction
  ): Promise<number> {
    const result = await (tx ?? this.databaseService.db).execute(sql`
      with basculees as (
        delete from ${indicateurValeurTable}
        where ${indicateurValeurTable.collectiviteId} = ${collectiviteId}
          and ${indicateurValeurTable.metadonneeId} = ${metadonneeId}
          and ${indicateurValeurTable.dateValeur} = ${dateValeurForYear(
      fromYear
    )}
          and ${inArray(indicateurValeurTable.indicateurId, indicateurIds)}
        returning
          indicateur_id,
          resultat,
          resultat_commentaire,
          objectif,
          objectif_commentaire,
          estimation,
          calcul_auto,
          calcul_auto_identifiants_manquants,
          created_by
      )
      insert into ${indicateurValeurTable} (
        collectivite_id,
        indicateur_id,
        date_valeur,
        metadonnee_id,
        resultat,
        resultat_commentaire,
        objectif,
        objectif_commentaire,
        estimation,
        calcul_auto,
        calcul_auto_identifiants_manquants,
        created_by,
        modified_by
      )
      select
        ${collectiviteId},
        basculees.indicateur_id,
        ${dateValeurForYear(toYear)},
        ${metadonneeId},
        basculees.resultat,
        basculees.resultat_commentaire,
        basculees.objectif,
        basculees.objectif_commentaire,
        basculees.estimation,
        basculees.calcul_auto,
        basculees.calcul_auto_identifiants_manquants,
        coalesce(basculees.created_by, ${userId}),
        ${userId}
      from basculees
      on conflict (indicateur_id, collectivite_id, date_valeur, metadonnee_id)
        where metadonnee_id is not null
      do update set
        resultat = excluded.resultat,
        resultat_commentaire = excluded.resultat_commentaire,
        objectif = excluded.objectif,
        objectif_commentaire = excluded.objectif_commentaire,
        estimation = excluded.estimation,
        calcul_auto = excluded.calcul_auto,
        calcul_auto_identifiants_manquants = excluded.calcul_auto_identifiants_manquants,
        modified_by = excluded.modified_by
      returning ${indicateurValeurTable.id}
    `);

    return result.rowCount ?? 0;
  }
}
