import { indicateurValeurTable } from '@/backend/indicateurs/index-domain';
import { and, eq, inArray } from 'drizzle-orm';
import { indicateurDefinitionTable } from '../src/indicateurs/shared/models/indicateur-definition.table';
import { DatabaseService } from '../src/utils/database/database.service';

export const getIndicateurIdByIdentifiant = async (
  databaseService: DatabaseService,
  identifiant: string
): Promise<number> => {
  const result = await databaseService.db
    .select({
      id: indicateurDefinitionTable.id,
    })
    .from(indicateurDefinitionTable)
    .where(eq(indicateurDefinitionTable.identifiantReferentiel, identifiant));
  if (result.length === 0) {
    throw new Error(`Indicateur with identifiant ${identifiant} not found`);
  }
  return result[0].id;
};

export const deleteIndicateurValeursForCollectivite = async (
  databaseService: DatabaseService,
  collectiviteId: number,
  indicateurIds: number[]
): Promise<void> => {
  await databaseService.db
    .delete(indicateurValeurTable)
    .where(
      and(
        eq(indicateurValeurTable.collectiviteId, collectiviteId),
        inArray(indicateurValeurTable.indicateurId, indicateurIds)
      )
    );
};
