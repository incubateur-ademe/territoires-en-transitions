import { Injectable } from '@nestjs/common';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  CollectiviteNatureType,
  CollectiviteType,
  collectiviteTypeEnum,
} from '@tet/domain/collectivites';
import {
  EPCI_FISCALITE_PROPRE_NATURES,
  IndicateurSourceEnum,
} from '@tet/domain/indicateurs';
import { and, asc, eq, inArray } from 'drizzle-orm';

export type Snbc3Millesime = {
  metadonneeId: number;
  /** Date du commit `snbc3` importé (ADR 0023, §2). */
  dateVersion: string;
};

export type Snbc3Collectivite = {
  id: number;
  nom: string;
  type: CollectiviteType;
  natureInsee: CollectiviteNatureType | null;
  regionCode: string | null;
  communeCode: string | null;
};

/** Lectures de la trajectoire SNBC 3 importée (lot 2 du plan SNBC 3). */
@Injectable()
export class TrajectoireSnbc3Repository {
  constructor(private readonly databaseService: DatabaseService) {}

  /** L'unique métadonnée `snbc3`, ou `null` avant le premier import. */
  async getMillesime(): Promise<Snbc3Millesime | null> {
    const [metadonnee] = await this.databaseService.db
      .select({
        metadonneeId: indicateurSourceMetadonneeTable.id,
        dateVersion: sqlToDateTimeISO(
          indicateurSourceMetadonneeTable.dateVersion
        ),
      })
      .from(indicateurSourceMetadonneeTable)
      .where(
        eq(indicateurSourceMetadonneeTable.sourceId, IndicateurSourceEnum.SNBC3)
      )
      .orderBy(asc(indicateurSourceMetadonneeTable.id))
      .limit(1);
    return metadonnee ?? null;
  }

  /** Une collectivité est dans le millésime si elle a au moins une valeur `snbc3`. */
  async hasValeurs(
    collectiviteId: number,
    metadonneeId: number
  ): Promise<boolean> {
    const [valeur] = await this.databaseService.db
      .select({ id: indicateurValeurTable.id })
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.metadonneeId, metadonneeId)
        )
      )
      .limit(1);
    return !!valeur;
  }

  async getCollectivite(
    collectiviteId: number
  ): Promise<Snbc3Collectivite | null> {
    const [collectivite] = await this.databaseService.db
      .select({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
        type: collectiviteTable.type,
        natureInsee: collectiviteTable.natureInsee,
        regionCode: collectiviteTable.regionCode,
        communeCode: collectiviteTable.communeCode,
      })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId));
    return collectivite ?? null;
  }

  /**
   * EPCI à fiscalité propre de rattachement d'une commune, d'après
   * `collectivite_relations` (périmètres Banatic). Le premier par ordre
   * alphabétique si la relation en donne plusieurs.
   */
  async findEpciParent(
    collectiviteId: number
  ): Promise<{ id: number; nom: string } | null> {
    const [parent] = await this.databaseService.db
      .select({ id: collectiviteTable.id, nom: collectiviteTable.nom })
      .from(collectiviteRelationsTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, collectiviteRelationsTable.parentId)
      )
      .where(
        and(
          eq(collectiviteRelationsTable.id, collectiviteId),
          inArray(collectiviteTable.natureInsee, [
            ...EPCI_FISCALITE_PROPRE_NATURES,
          ])
        )
      )
      .orderBy(asc(collectiviteTable.nom))
      .limit(1);
    return parent ?? null;
  }

  /**
   * Commune d'après son code INSEE
   */
  async findCommuneByCode(
    communeCode: string
  ): Promise<{ id: number; nom: string } | null> {
    const [commune] = await this.databaseService.db
      .select({ id: collectiviteTable.id, nom: collectiviteTable.nom })
      .from(collectiviteTable)
      .where(
        and(
          eq(collectiviteTable.communeCode, communeCode),
          eq(collectiviteTable.type, collectiviteTypeEnum.COMMUNE)
        )
      )
      // commune_code n'est pas unique en base : pas de doublon connu à ce jour
      // mais le tri par id rend le résultat stable.
      .orderBy(asc(collectiviteTable.id))
      .limit(1);
    return commune ?? null;
  }
}
