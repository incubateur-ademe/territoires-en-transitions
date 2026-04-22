import { Injectable, Logger } from '@nestjs/common';
import { annexeTable } from '@tet/backend/collectivites/documents/models/annexe.table';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { AnnexeInfo } from '@tet/domain/collectivites';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class FicheAnnexesRepository {
  private readonly logger = new Logger(FicheAnnexesRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listByFicheId(ficheId: number): Promise<AnnexeInfo[]> {
    try {
      const rows = await this.databaseService.db
        .select({
          id: annexeTable.id,
          modifiedAt: sql<string | null>`${annexeTable.modifiedAt}::text`.as(
            'modified_at'
          ),
          modifiedByNom:
            sql<string | null>`CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})`.as(
              'modified_by_nom'
            ),
          commentaire: annexeTable.commentaire,
          filename: bibliothequeFichierTable.filename,
          titre: annexeTable.titre,
          url: annexeTable.url,
        })
        .from(annexeTable)
        .leftJoin(
          bibliothequeFichierTable,
          eq(bibliothequeFichierTable.id, annexeTable.fichierId)
        )
        .leftJoin(dcpTable, eq(dcpTable.id, annexeTable.modifiedBy))
        .where(eq(annexeTable.ficheId, ficheId));

      return rows;
    } catch (error) {
      this.logger.warn(
        `Impossible de charger les annexes pour la fiche ${ficheId} : ${error}`
      );
      return [];
    }
  }
}
