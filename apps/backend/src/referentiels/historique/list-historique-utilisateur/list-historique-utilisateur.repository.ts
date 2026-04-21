import { Injectable } from '@nestjs/common';
import { historiqueJustificationTable } from '@tet/backend/collectivites/personnalisations/models/historique-justification.table';
import { historiqueReponseDisplayView } from '@tet/backend/collectivites/personnalisations/models/historique-reponse-display.view';
import { historiqueActionCommentaireTable } from '@tet/backend/referentiels/models/historique-action-commentaire.table';
import { historiqueActionStatutTable } from '@tet/backend/referentiels/models/historique-action-statut.table';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { SYSTEM_MODIFIED_BY_SQL_LITERAL } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { HistoriqueUtilisateur } from '@tet/domain/referentiels';
import { eq, ne, sql } from 'drizzle-orm';
import { AnyPgColumn, union } from 'drizzle-orm/pg-core';

@Injectable()
export class ListHistoriqueUtilisateurRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Reconstitue le contenu de la vue `public.historique_utilisateur` (modulo
   * son filtre `have_lecture_acces` qui dépend de `auth.uid()` — la
   * permission est vérifiée côté service). Concrètement : tous les
   * `modified_by` distincts sur les 4 sources d'historique pour la
   * collectivité, enrichis du prénom+nom du DCP correspondant. Le
   * sentinelle synthétique `DEFAULT_MODIFIED_BY` est filtré du résultat
   * (les lignes sans modifiedBy restent visibles comme « Équipe territoires
   * en transitions » sur les items, mais ne doivent pas apparaître dans la
   * dropdown FiltreMembre).
   *
   * Équivalence stricte au SQL pré-extraction : mêmes 4 sub-selects, même
   * `union` (pas `unionAll` — déduplication des contributeurs), même filtre
   * final.
   */
  async listContributors(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<HistoriqueUtilisateur[]> {
    const utilisateursUnion = union(
      this.selectStatutContributors(collectiviteId),
      this.selectPrecisionContributors(collectiviteId),
      this.selectReponseContributors(collectiviteId),
      this.selectJustificationContributors(collectiviteId)
    ).as('utilisateurs');

    const db = tx ?? this.databaseService.db;
    return db
      .select()
      .from(utilisateursUnion)
      .where(
        ne(utilisateursUnion.modifiedById, SYSTEM_MODIFIED_BY_SQL_LITERAL)
      );
  }

  /**
   * Construit les deux colonnes `modifiedById` + `modifiedByNom` à
   * sélectionner dans chaque branche de l'union. On retombe sur une UUID
   * synthétique et sur le nom d'équipe par défaut quand la ligne historique
   * n'a pas de `modifiedBy` (ou que le compte DCP n'a pas été trouvé par le
   * leftJoin).
   */
  private modifiedBySelect(modifiedBy: AnyPgColumn) {
    return {
      modifiedById:
        sql<string>`coalesce(${modifiedBy}, ${SYSTEM_MODIFIED_BY_SQL_LITERAL})`.as(
          'modified_by_id'
        ),
      modifiedByNom: createdByNom.as('modified_by_nom'),
    };
  }

  private selectStatutContributors(collectiviteId: number) {
    return this.databaseService.db
      .select(this.modifiedBySelect(historiqueActionStatutTable.modifiedBy))
      .from(historiqueActionStatutTable)
      .leftJoin(
        dcpTable,
        eq(dcpTable.id, historiqueActionStatutTable.modifiedBy)
      )
      .where(eq(historiqueActionStatutTable.collectiviteId, collectiviteId));
  }

  private selectPrecisionContributors(collectiviteId: number) {
    return this.databaseService.db
      .select(
        this.modifiedBySelect(historiqueActionCommentaireTable.modifiedBy)
      )
      .from(historiqueActionCommentaireTable)
      .leftJoin(
        dcpTable,
        eq(dcpTable.id, historiqueActionCommentaireTable.modifiedBy)
      )
      .where(
        eq(historiqueActionCommentaireTable.collectiviteId, collectiviteId)
      );
  }

  private selectReponseContributors(collectiviteId: number) {
    return this.databaseService.db
      .select(this.modifiedBySelect(historiqueReponseDisplayView.modifiedBy))
      .from(historiqueReponseDisplayView)
      .leftJoin(
        dcpTable,
        eq(dcpTable.id, historiqueReponseDisplayView.modifiedBy)
      )
      .where(eq(historiqueReponseDisplayView.collectiviteId, collectiviteId));
  }

  private selectJustificationContributors(collectiviteId: number) {
    return this.databaseService.db
      .select(this.modifiedBySelect(historiqueJustificationTable.modifiedBy))
      .from(historiqueJustificationTable)
      .leftJoin(
        dcpTable,
        eq(dcpTable.id, historiqueJustificationTable.modifiedBy)
      )
      .where(eq(historiqueJustificationTable.collectiviteId, collectiviteId));
  }
}
