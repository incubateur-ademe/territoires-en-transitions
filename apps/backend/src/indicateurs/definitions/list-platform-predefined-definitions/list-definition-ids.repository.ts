import { indicateurDefinitionTable } from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, inArray, isNotNull, isNull } from 'drizzle-orm';

@Injectable()
export class ListDefinitionIdsRepository {
  private readonly logger = new Logger(ListDefinitionIdsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** Donne les id des indicateurs à partir de leur identifiant référentiel */
  async listDefinitionIdsByIdentifiantReferentiels(
    identifiantsReferentiel: string[]
  ): Promise<Record<string, number>> {
    this.logger.log(
      `Récupération des id des indicateurs ${identifiantsReferentiel?.join(
        ','
      )}`
    );

    if (!identifiantsReferentiel?.length) {
      return {};
    }

    const definitions = await this.databaseService.db
      .select({
        id: indicateurDefinitionTable.id,
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
      })
      .from(indicateurDefinitionTable)
      .where(
        and(
          isNotNull(indicateurDefinitionTable.identifiantReferentiel),
          isNull(indicateurDefinitionTable.collectiviteId),
          inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiantsReferentiel
          )
        )
      )
      .orderBy(indicateurDefinitionTable.identifiantReferentiel);

    this.logger.log(`${definitions.length} définitions trouvées`);

    const indicateurIdParIdentifiant = Object.fromEntries(
      definitions.map(({ id, identifiant }) => [identifiant, id])
    );

    return indicateurIdParIdentifiant;
  }
}
