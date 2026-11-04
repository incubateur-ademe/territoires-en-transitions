import { Injectable, Logger } from '@nestjs/common';
import { groupementCollectiviteTable } from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { Indicateur } from '@tet/domain/indicateurs';
import { indicateurSelection } from '../../indicateur/indicateur.column';
import { validateNatures } from '../../indicateur/indicateur.adapter';
import {
  and,
  eq,
  exists,
  inArray,
  isNull,
  or,
  sql,
  SQLWrapper,
} from 'drizzle-orm';

@Injectable()
export class ListCollectiviteIndicateursRepository {
  private readonly logger = new Logger(
    ListCollectiviteIndicateursRepository.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  async listCollectiviteIndicateurs(
    {
      identifiantsReferentiel,
      indicateurIds,
      collectiviteId,
    }: {
      identifiantsReferentiel?: string[];
      indicateurIds?: number[];
      collectiviteId?: number;
    } = {},
    tx?: Transaction
  ): Promise<Result<Indicateur[], 'DATABASE_ERROR'>> {
    this.logger.log(
      `Récupération des définitions des indicateurs ${identifiantsReferentiel?.join(
        ','
      )}`
    );

    const byIdentifiantReferentiels =
      identifiantsReferentiel && identifiantsReferentiel.length
        ? inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiantsReferentiel
          )
        : undefined;

    const byIds =
      indicateurIds && indicateurIds.length
        ? inArray(indicateurDefinitionTable.id, indicateurIds)
        : undefined;

    const byCollectiviteId = collectiviteId
      ? or(
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
          and(
            isNull(indicateurDefinitionTable.collectiviteId),
            isNull(indicateurDefinitionTable.groupementId)
          ),
          exists(sql`(
            select 1 from ${groupementCollectiviteTable}
            where ${groupementCollectiviteTable.groupementId} = ${indicateurDefinitionTable.groupementId}
              and ${groupementCollectiviteTable.collectiviteId} = ${collectiviteId}
          )`)
        )
      : undefined;

    const conditions: (SQLWrapper | undefined)[] = [
      byIdentifiantReferentiels,
      byIds,
      byCollectiviteId,
    ];

    const indicateurs = await (tx ?? this.databaseService.db)
      .select(indicateurSelection)
      .from(indicateurDefinitionTable)
      .where(and(...conditions));

    this.logger.log(`${indicateurs.length} définitions trouvées`);

    return validateNatures(indicateurs);
  }
}
