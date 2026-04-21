import { Injectable } from '@nestjs/common';
import { historiqueJustificationTable } from '@tet/backend/collectivites/personnalisations/models/historique-justification.table';
import { historiqueReponseDisplayView } from '@tet/backend/collectivites/personnalisations/models/historique-reponse-display.view';
import { questionThematiqueTable } from '@tet/backend/collectivites/personnalisations/models/question-thematique.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionNodeView } from '@tet/backend/referentiels/models/action-node.view';
import { historiqueActionCommentaireTable } from '@tet/backend/referentiels/models/historique-action-commentaire.table';
import { historiqueActionStatutTable } from '@tet/backend/referentiels/models/historique-action-statut.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { SYSTEM_MODIFIED_BY_SQL_LITERAL } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  ActionTypeEnum,
  ListHistoriqueInput,
  NB_HISTORIQUE_ITEMS_PER_PAGE,
} from '@tet/domain/referentiels';
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  like,
  lt,
  or,
  sql,
  SQL,
} from 'drizzle-orm';
import { alias, unionAll } from 'drizzle-orm/pg-core';

/**
 * Ligne brute issue du `unionAll` des 4 sources d'historique. Le service
 * appelant la transforme en variante typée de `HistoriqueItem` via
 * `mapRowToItem` (le mapping est du domaine, pas de la persistance).
 */
export type HistoriqueUnionRow = {
  type: string;
  collectiviteId: number;
  modifiedById: string;
  modifiedByNom: string;
  modifiedAt: string;
  previousModifiedById: string | null;
  previousModifiedAt: string | null;
  actionId: string | null;
  actionIdentifiant: string | null;
  actionNom: string | null;
  tacheIdentifiant: string | null;
  tacheNom: string | null;
  actionIds: string[] | null;
  avancement:
    | 'fait'
    | 'programme'
    | 'pas_fait'
    | 'detaille'
    | 'non_renseigne'
    | null;
  previousAvancement:
    | 'fait'
    | 'programme'
    | 'pas_fait'
    | 'detaille'
    | 'non_renseigne'
    | null;
  avancementDetaille: number[] | null;
  previousAvancementDetaille: number[] | null;
  concerne: boolean | null;
  previousConcerne: boolean | null;
  precision: string | null;
  previousPrecision: string | null;
  questionId: string | null;
  questionType: string | null;
  questionFormulation: string | null;
  thematiqueId: string | null;
  thematiqueNom: string | null;
  reponse: unknown;
  previousReponse: unknown;
  justification: string | null;
  previousJustification: string | null;
};

@Injectable()
export class ListHistoriqueRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Reconstitue le contenu de la vue `public.historique` via quatre selects
   * Drizzle unionnés (sans la clause `have_lecture_acces` qui dépend de
   * `auth.uid()` — la permission est vérifiée côté service). Applique les
   * filtres conditionnels (actionId, modifiedBy, types, startDate, endDate),
   * la pagination et le comptage en parallèle.
   *
   * Équivalence stricte au SQL pré-extraction : mêmes joins, mêmes
   * sentinelles `null::*`, même `unionAll`, mêmes `where`, mêmes
   * `order by`/`limit`/`offset`. La régression est couverte par
   * `historique.router.e2e-spec.ts`.
   *
   * Pagination : on utilise une fonction-fenêtre `count(*) OVER ()` pour
   * obtenir le total agrégé sur le même snapshot MVCC que la page courante,
   * en une seule requête. Cela élimine la fenêtre de course entre la
   * requête `rows` et la requête `count` quand des écritures concurrentes
   * tombent entre les deux (sinon `total` peut être incohérent avec
   * `items.length`). Sur une page vide, la fenêtre n'a rien à agréger : la
   * requête ne retourne aucune ligne et on retourne `total: 0` — ce qui est
   * la valeur attendue côté frontend (cf. test e2e #10 sur la pagination).
   */
  async listHistorique(
    input: ListHistoriqueInput,
    tx?: Transaction
  ): Promise<{ rows: HistoriqueUnionRow[]; total: number }> {
    const { collectiviteId, actionId, filters } = input;
    const { page, modifiedBy, types, startDate, endDate } = filters;

    const historiqueUnion = unionAll(
      this.selectActionStatutBranch(),
      this.selectActionPrecisionBranch(),
      this.selectReponseBranch(),
      this.selectJustificationBranch()
    ).as('historique_union');

    const conditions: SQL[] = [
      eq(historiqueUnion.collectiviteId, collectiviteId),
    ];
    if (actionId) {
      // On échappe les méta-caractères de LIKE dans actionId avant de
      // construire le pattern. Le caractère d'échappement par défaut de
      // Postgres est `\` ; on l'utilise donc pour échapper `\`, `%` et `_`.
      //
      // Le LIKE est ancré sur le séparateur `.` (`<actionId>.%`) pour ne
      // remonter que les descendants stricts dans la hiérarchie pointée :
      // un préfixe nu (`<actionId>%`) ferait remonter `cae_1.10` en filtrant
      // sur `cae_1.1`. La correspondance exacte est gérée par un `eq`
      // dédié pour couvrir les lignes dont l'actionId est précisément la
      // valeur filtrée.
      const escapedActionId = actionId.replace(/[\\%_]/g, '\\$&');
      const actionIdFilter = or(
        sql`${historiqueUnion.actionIds} @> array[${actionId}]::varchar(30)[]`,
        eq(historiqueUnion.actionId, actionId),
        like(historiqueUnion.actionId, `${escapedActionId}.%`)
      );
      if (actionIdFilter) conditions.push(actionIdFilter);
    }
    if (modifiedBy && modifiedBy.length > 0) {
      conditions.push(inArray(historiqueUnion.modifiedById, modifiedBy));
    }
    if (types && types.length > 0) {
      conditions.push(inArray(historiqueUnion.type, types));
    }
    if (startDate) {
      conditions.push(gte(historiqueUnion.modifiedAt, startDate));
    }
    // Inclure la journée complète de `endDate` jusqu'à 23:59:59.999, sans
    // déborder sur le lendemain. Postgres interprète `${endDate} 24:00` comme
    // minuit le lendemain : un `<` strict exclut donc le tout début du jour
    // suivant tout en incluant tous les évènements de la journée demandée.
    if (endDate) {
      conditions.push(lt(historiqueUnion.modifiedAt, `${endDate} 24:00`));
    }
    const whereClause = and(...conditions);

    const currentPage = page ?? 1;
    const offset = (currentPage - 1) * NB_HISTORIQUE_ITEMS_PER_PAGE;

    const db = tx ?? this.databaseService.db;
    const rowsWithTotal = await db
      .select({
        type: historiqueUnion.type,
        collectiviteId: historiqueUnion.collectiviteId,
        modifiedById: historiqueUnion.modifiedById,
        modifiedByNom: historiqueUnion.modifiedByNom,
        modifiedAt: historiqueUnion.modifiedAt,
        previousModifiedById: historiqueUnion.previousModifiedById,
        previousModifiedAt: historiqueUnion.previousModifiedAt,
        actionId: historiqueUnion.actionId,
        actionIdentifiant: historiqueUnion.actionIdentifiant,
        actionNom: historiqueUnion.actionNom,
        tacheIdentifiant: historiqueUnion.tacheIdentifiant,
        tacheNom: historiqueUnion.tacheNom,
        actionIds: historiqueUnion.actionIds,
        avancement: historiqueUnion.avancement,
        previousAvancement: historiqueUnion.previousAvancement,
        avancementDetaille: historiqueUnion.avancementDetaille,
        previousAvancementDetaille: historiqueUnion.previousAvancementDetaille,
        concerne: historiqueUnion.concerne,
        previousConcerne: historiqueUnion.previousConcerne,
        precision: historiqueUnion.precision,
        previousPrecision: historiqueUnion.previousPrecision,
        questionId: historiqueUnion.questionId,
        questionType: historiqueUnion.questionType,
        questionFormulation: historiqueUnion.questionFormulation,
        thematiqueId: historiqueUnion.thematiqueId,
        thematiqueNom: historiqueUnion.thematiqueNom,
        reponse: historiqueUnion.reponse,
        previousReponse: historiqueUnion.previousReponse,
        justification: historiqueUnion.justification,
        previousJustification: historiqueUnion.previousJustification,
        total: sql<number>`count(*) OVER ()::int`.as('total'),
      })
      .from(historiqueUnion)
      .where(whereClause)
      .orderBy(desc(historiqueUnion.modifiedAt))
      .limit(NB_HISTORIQUE_ITEMS_PER_PAGE)
      .offset(offset);

    // Sépare le total agrégé (window function) des lignes de la page : le
    // schéma de sortie ne doit pas exposer la colonne `total` sur chaque
    // item.
    const total = rowsWithTotal[0]?.total ?? 0;
    const rows: HistoriqueUnionRow[] = rowsWithTotal.map(
      ({ total: _ignored, ...row }) => row
    );

    return { rows, total };
  }

  // Sentinelles `null::*` partagées entre les 4 branches du `unionAll`.
  // Drizzle aligne les colonnes par position et type ; ces casts garantissent
  // que les selects produisent des colonnes du même type SQL même quand la
  // branche n'a pas la donnée.
  private readonly nullText = sql<string | null>`null::text`;
  private readonly nullJsonb = sql<unknown>`null::jsonb`;
  private readonly nullAvancement = sql<
    typeof historiqueActionStatutTable.$inferSelect.avancement | null
  >`null::avancement`;
  private readonly nullBoolean = sql<boolean | null>`null::boolean`;
  private readonly nullDoubleArray = sql<
    number[] | null
  >`null::double precision[]`;
  private readonly nullVarchar30 = sql<string | null>`null::varchar(30)`;

  // Branche 1 — historique.action_statut
  private selectActionStatutBranch() {
    // Alias de action_definition pour distinguer la définition de la tâche
    // modifiée et celle de son action parente.
    const ad = alias(actionDefinitionTable, 'ad'); // action parente
    const td = alias(actionDefinitionTable, 'td'); // tâche elle-même
    const ah = actionNodeView; // noeud pour remonter à l'action parente

    return this.databaseService.db
      .select({
        type: sql<string>`'action_statut'::text`.as('type'),
        collectiviteId: historiqueActionStatutTable.collectiviteId,
        modifiedById:
          sql<string>`coalesce(${historiqueActionStatutTable.modifiedBy}, ${SYSTEM_MODIFIED_BY_SQL_LITERAL})`.as(
            'modified_by_id'
          ),
        previousModifiedById: historiqueActionStatutTable.previousModifiedBy,
        modifiedAt: historiqueActionStatutTable.modifiedAt,
        previousModifiedAt: historiqueActionStatutTable.previousModifiedAt,
        actionId: sql<
          string | null
        >`${historiqueActionStatutTable.actionId}`.as('action_id'),
        avancement: sql<
          typeof historiqueActionStatutTable.$inferSelect.avancement | null
        >`${historiqueActionStatutTable.avancement}`.as('avancement'),
        previousAvancement: sql<
          typeof historiqueActionStatutTable.$inferSelect.avancement | null
        >`coalesce(${historiqueActionStatutTable.previousAvancement}, 'non_renseigne')::avancement`.as(
          'previous_avancement'
        ),
        avancementDetaille: historiqueActionStatutTable.avancementDetaille,
        previousAvancementDetaille:
          historiqueActionStatutTable.previousAvancementDetaille,
        concerne: sql<
          boolean | null
        >`${historiqueActionStatutTable.concerne}`.as('concerne'),
        previousConcerne: historiqueActionStatutTable.previousConcerne,
        precision: this.nullText.as('precision'),
        previousPrecision: this.nullText.as('previous_precision'),
        questionId: this.nullVarchar30.as('question_id'),
        questionType: this.nullVarchar30.as('question_type'),
        reponse: this.nullJsonb.as('reponse'),
        previousReponse: this.nullJsonb.as('previous_reponse'),
        justification: this.nullText.as('justification'),
        previousJustification: this.nullText.as('previous_justification'),
        modifiedByNom: createdByNom.as('modified_by_nom'),
        tacheIdentifiant: sql<string | null>`${td.identifiant}`.as(
          'tache_identifiant'
        ),
        tacheNom: sql<string | null>`${td.nom}`.as('tache_nom'),
        actionIdentifiant: sql<string | null>`${ad.identifiant}`.as(
          'action_identifiant'
        ),
        actionNom: sql<string | null>`${ad.nom}`.as('action_nom'),
        questionFormulation: this.nullText.as('question_formulation'),
        thematiqueId: this.nullVarchar30.as('thematique_id'),
        thematiqueNom: this.nullText.as('thematique_nom'),
        actionIds: sql<
          string[] | null
        >`array[${historiqueActionStatutTable.actionId}]::varchar(30)[]`.as(
          'action_ids'
        ),
      })
      .from(historiqueActionStatutTable)
      .leftJoin(
        ah,
        and(
          sql`${historiqueActionStatutTable.actionId} = any(${ah.descendants})`,
          eq(ah.type, ActionTypeEnum.ACTION)
        )
      )
      .leftJoin(ad, eq(ad.actionId, ah.actionId))
      .leftJoin(td, eq(td.actionId, historiqueActionStatutTable.actionId))
      .leftJoin(
        dcpTable,
        eq(dcpTable.id, historiqueActionStatutTable.modifiedBy)
      );
  }

  // Branche 2 — historique.action_precision
  private selectActionPrecisionBranch() {
    const ad = alias(actionDefinitionTable, 'ad');
    const td = alias(actionDefinitionTable, 'td');
    const ah = actionNodeView;

    return this.databaseService.db
      .select({
        type: sql<string>`'action_precision'::text`.as('type'),
        collectiviteId: historiqueActionCommentaireTable.collectiviteId,
        modifiedById:
          sql<string>`coalesce(${historiqueActionCommentaireTable.modifiedBy}, ${SYSTEM_MODIFIED_BY_SQL_LITERAL})`.as(
            'modified_by_id'
          ),
        previousModifiedById:
          historiqueActionCommentaireTable.previousModifiedBy,
        modifiedAt: historiqueActionCommentaireTable.modifiedAt,
        previousModifiedAt: historiqueActionCommentaireTable.previousModifiedAt,
        actionId: historiqueActionCommentaireTable.actionId,
        avancement: this.nullAvancement.as('avancement'),
        previousAvancement: this.nullAvancement.as('previous_avancement'),
        avancementDetaille: this.nullDoubleArray.as('avancement_detaille'),
        previousAvancementDetaille: this.nullDoubleArray.as(
          'previous_avancement_detaille'
        ),
        concerne: this.nullBoolean.as('concerne'),
        previousConcerne: this.nullBoolean.as('previous_concerne'),
        precision: historiqueActionCommentaireTable.precision,
        previousPrecision: historiqueActionCommentaireTable.previousPrecision,
        questionId: this.nullVarchar30.as('question_id'),
        questionType: this.nullVarchar30.as('question_type'),
        reponse: this.nullJsonb.as('reponse'),
        previousReponse: this.nullJsonb.as('previous_reponse'),
        justification: this.nullText.as('justification'),
        previousJustification: this.nullText.as('previous_justification'),
        modifiedByNom: createdByNom.as('modified_by_nom'),
        tacheIdentifiant: sql<string | null>`${td.identifiant}`.as(
          'tache_identifiant'
        ),
        tacheNom: sql<string | null>`${td.nom}`.as('tache_nom'),
        actionIdentifiant: sql<string | null>`${ad.identifiant}`.as(
          'action_identifiant'
        ),
        actionNom: sql<string | null>`${ad.nom}`.as('action_nom'),
        questionFormulation: this.nullText.as('question_formulation'),
        thematiqueId: this.nullVarchar30.as('thematique_id'),
        thematiqueNom: this.nullText.as('thematique_nom'),
        actionIds: sql<
          string[] | null
        >`array[${historiqueActionCommentaireTable.actionId}]::varchar(30)[]`.as(
          'action_ids'
        ),
      })
      .from(historiqueActionCommentaireTable)
      .leftJoin(
        ah,
        and(
          sql`${historiqueActionCommentaireTable.actionId} = any(${ah.descendants})`,
          eq(ah.type, ActionTypeEnum.ACTION)
        )
      )
      .leftJoin(ad, eq(ad.actionId, ah.actionId))
      .leftJoin(td, eq(td.actionId, historiqueActionCommentaireTable.actionId))
      .leftJoin(
        dcpTable,
        eq(dcpTable.id, historiqueActionCommentaireTable.modifiedBy)
      );
  }

  // Branche 3 — historique.reponse_display
  private selectReponseBranch() {
    const reponseJustificationSubquery = sql<string | null>`(
      select texte
      from historique.justification hj
      where hj.collectivite_id = ${historiqueReponseDisplayView.collectiviteId}
        and hj.question_id = ${historiqueReponseDisplayView.questionId}
        and hj.modified_at <= ${historiqueReponseDisplayView.modifiedAt}
      order by hj.modified_at desc
      limit 1
    )`;
    const reponseActionIdsSubquery = sql<string[] | null>`(
      select array_agg(${questionActionTable.actionId})
      from ${questionActionTable}
      where ${eq(
        questionActionTable.questionId,
        historiqueReponseDisplayView.questionId
      )}
      group by ${questionActionTable.questionId}
    )`;

    return this.databaseService.db
      .select({
        type: sql<string>`'reponse'::text`.as('type'),
        collectiviteId: historiqueReponseDisplayView.collectiviteId,
        modifiedById:
          sql<string>`coalesce(${historiqueReponseDisplayView.modifiedBy}, ${SYSTEM_MODIFIED_BY_SQL_LITERAL})`.as(
            'modified_by_id'
          ),
        previousModifiedById: historiqueReponseDisplayView.previousModifiedBy,
        modifiedAt: historiqueReponseDisplayView.modifiedAt,
        previousModifiedAt: historiqueReponseDisplayView.previousModifiedAt,
        actionId: this.nullVarchar30.as('action_id'),
        avancement: this.nullAvancement.as('avancement'),
        previousAvancement: this.nullAvancement.as('previous_avancement'),
        avancementDetaille: this.nullDoubleArray.as('avancement_detaille'),
        previousAvancementDetaille: this.nullDoubleArray.as(
          'previous_avancement_detaille'
        ),
        concerne: this.nullBoolean.as('concerne'),
        previousConcerne: this.nullBoolean.as('previous_concerne'),
        precision: this.nullText.as('precision'),
        previousPrecision: this.nullText.as('previous_precision'),
        questionId: sql<
          string | null
        >`${historiqueReponseDisplayView.questionId}::text`.as('question_id'),
        questionType: sql<
          string | null
        >`${historiqueReponseDisplayView.questionType}::text`.as(
          'question_type'
        ),
        reponse: historiqueReponseDisplayView.reponse,
        previousReponse: historiqueReponseDisplayView.previousReponse,
        justification: reponseJustificationSubquery.as('justification'),
        previousJustification: this.nullText.as('previous_justification'),
        modifiedByNom: createdByNom.as('modified_by_nom'),
        tacheIdentifiant: this.nullText.as('tache_identifiant'),
        tacheNom: this.nullText.as('tache_nom'),
        actionIdentifiant: this.nullText.as('action_identifiant'),
        actionNom: this.nullText.as('action_nom'),
        questionFormulation: questionTable.formulation,
        thematiqueId: questionTable.thematiqueId,
        thematiqueNom: questionThematiqueTable.nom,
        actionIds: reponseActionIdsSubquery.as('action_ids'),
      })
      .from(historiqueReponseDisplayView)
      .leftJoin(
        questionTable,
        eq(historiqueReponseDisplayView.questionId, questionTable.id)
      )
      .leftJoin(
        questionThematiqueTable,
        eq(questionTable.thematiqueId, questionThematiqueTable.id)
      )
      .leftJoin(
        dcpTable,
        eq(dcpTable.id, historiqueReponseDisplayView.modifiedBy)
      );
  }

  // Branche 4 — historique.justification
  private selectJustificationBranch() {
    const justificationReponseSubquery = sql<unknown>`(
      select reponse
      from historique.reponse_display hr
      where hr.modified_at <= ${historiqueJustificationTable.modifiedAt}
        and hr.collectivite_id = ${historiqueJustificationTable.collectiviteId}
        and hr.question_id = ${historiqueJustificationTable.questionId}
      order by hr.modified_at desc
      limit 1
    )`;
    const justificationActionIdsSubquery = sql<string[] | null>`(
      select array_agg(${questionActionTable.actionId})
      from ${questionActionTable}
      where ${eq(
        questionActionTable.questionId,
        historiqueJustificationTable.questionId
      )}
      group by ${questionActionTable.questionId}
    )`;

    return this.databaseService.db
      .select({
        type: sql<string>`'justification'::text`.as('type'),
        collectiviteId: historiqueJustificationTable.collectiviteId,
        modifiedById:
          sql<string>`coalesce(${historiqueJustificationTable.modifiedBy}, ${SYSTEM_MODIFIED_BY_SQL_LITERAL})`.as(
            'modified_by_id'
          ),
        previousModifiedById: historiqueJustificationTable.previousModifiedBy,
        modifiedAt: historiqueJustificationTable.modifiedAt,
        previousModifiedAt: historiqueJustificationTable.previousModifiedAt,
        actionId: this.nullVarchar30.as('action_id'),
        avancement: this.nullAvancement.as('avancement'),
        previousAvancement: this.nullAvancement.as('previous_avancement'),
        avancementDetaille: this.nullDoubleArray.as('avancement_detaille'),
        previousAvancementDetaille: this.nullDoubleArray.as(
          'previous_avancement_detaille'
        ),
        concerne: this.nullBoolean.as('concerne'),
        previousConcerne: this.nullBoolean.as('previous_concerne'),
        precision: this.nullText.as('precision'),
        previousPrecision: this.nullText.as('previous_precision'),
        questionId: sql<
          string | null
        >`${historiqueJustificationTable.questionId}::text`.as('question_id'),
        questionType: sql<string | null>`${questionTable.type}::text`.as(
          'question_type'
        ),
        reponse: justificationReponseSubquery.as('reponse'),
        previousReponse: this.nullJsonb.as('previous_reponse'),
        justification: historiqueJustificationTable.texte,
        previousJustification: historiqueJustificationTable.previousTexte,
        modifiedByNom: createdByNom.as('modified_by_nom'),
        tacheIdentifiant: this.nullText.as('tache_identifiant'),
        tacheNom: this.nullText.as('tache_nom'),
        actionIdentifiant: this.nullText.as('action_identifiant'),
        actionNom: this.nullText.as('action_nom'),
        questionFormulation: questionTable.formulation,
        thematiqueId: questionTable.thematiqueId,
        thematiqueNom: questionThematiqueTable.nom,
        actionIds: justificationActionIdsSubquery.as('action_ids'),
      })
      .from(historiqueJustificationTable)
      .leftJoin(
        questionTable,
        eq(questionTable.id, historiqueJustificationTable.questionId)
      )
      .leftJoin(
        questionThematiqueTable,
        eq(questionTable.thematiqueId, questionThematiqueTable.id)
      )
      .leftJoin(
        dcpTable,
        eq(dcpTable.id, historiqueJustificationTable.modifiedBy)
      );
  }
}
