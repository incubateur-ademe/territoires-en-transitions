import {
  Collectivite,
  collectiviteTable,
  collectiviteTypeEnum,
  CollectiviteUpdateNIC,
  CollectiviteUpsert,
} from '@/backend/collectivites/shared/models/collectivite.table';
import { banaticTable } from '@/backend/collectivites/shared/models/imports-banatic.table';
import { importCommuneTable } from '@/backend/collectivites/shared/models/imports-commune.table';
import { departementTable } from '@/backend/collectivites/shared/models/imports-departement.table';
import { regionTable } from '@/backend/collectivites/shared/models/imports-region.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, sql, SQL } from 'drizzle-orm';

type colInfo = {
  nom: string | null;
  departementCode?: string | null;
  regionCode: string | null;
  population: number | null;
  natureInsee?: string | null;
};

@Injectable()
export default class CollectiviteCrudService {
  private readonly logger = new Logger(CollectiviteCrudService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async upsert(collectivite: CollectiviteUpsert): Promise<Collectivite> {
    const { id, modifiedAt, ...rest } = collectivite;
    // Check if the "collectivité" to insert already exist
    if (!id) {
      const col = await this.find(collectivite);
      if (col)
        throw new Error(
          `La collectivité ${col.nom} existe déjà sous l'identifiant ${col.id}`
        );
    }
    const [result] = (await this.databaseService.db
      .insert(collectiviteTable)
      .values({ ...collectivite, nom: collectivite.nom ?? '' })
      .onConflictDoUpdate({
        target: [collectiviteTable.id],
        set: {
          ...rest,
          modifiedAt: new Date().toISOString(),
        },
      })
      .returning()) as Collectivite[];
    return result;
  }

  /**
   * Tables from schema imports contain additional information about "collectivités"
   * @param collectivite
   */
  async getAdditionalInformation(
    collectivite: CollectiviteUpsert
  ): Promise<CollectiviteUpsert> {
    let info: colInfo | undefined;

    switch (collectivite.type) {
      // Get more info from imports.banatic
      case collectiviteTypeEnum.EPCI:
        if (collectivite.siren) {
          [info] = await this.databaseService.db
            .select({
              nom: banaticTable.libelle,
              departementCode: banaticTable.departementCode,
              regionCode: banaticTable.regionCode,
              population: banaticTable.population,
              natureInsee: banaticTable.nature,
            })
            .from(banaticTable)
            .where(eq(banaticTable.siren, collectivite.siren));
        }
        break;

      // Get more info from imports.commune
      case collectiviteTypeEnum.COMMUNE:
        if (collectivite.communeCode) {
          [info] = await this.databaseService.db
            .select({
              nom: importCommuneTable.libelle,
              departementCode: importCommuneTable.departementCode,
              regionCode: importCommuneTable.regionCode,
              population: importCommuneTable.population,
            })
            .from(importCommuneTable)
            .where(eq(importCommuneTable.code, collectivite.communeCode));
        }
        break;

      // Get more info from imports.departement
      case collectiviteTypeEnum.DEPARTEMENT:
        if (collectivite.departementCode) {
          [info] = await this.databaseService.db
            .select({
              nom: departementTable.libelle,
              departementCode: departementTable.code,
              regionCode: departementTable.regionCode,
              population: departementTable.population,
            })
            .from(departementTable)
            .where(eq(departementTable.code, collectivite.departementCode));
        }
        break;

      // Get more info from imports.region
      case collectiviteTypeEnum.REGION:
        if (collectivite.regionCode) {
          [info] = await this.databaseService.db
            .select({
              nom: regionTable.libelle,
              regionCode: regionTable.code,
              population: regionTable.population,
            })
            .from(regionTable)
            .where(eq(regionTable.code, collectivite.regionCode));
        }
        break;
    }

    if (!info) return collectivite;
    return {
      ...collectivite,
      nom: collectivite.nom ?? info.nom ?? '',
      departementCode: collectivite.departementCode ?? info.departementCode,
      regionCode: collectivite.regionCode ?? info.regionCode,
      population: collectivite.population ?? info.population,
      natureInsee: collectivite.natureInsee ?? info.natureInsee,
    };
  }

  /**
   * Cherche si une collectivité existe déjà sans passer par l'id
   * @param collectivite
   */
  async find(collectivite: CollectiviteUpsert): Promise<Collectivite | null> {
    const condition = [];
    condition.push(eq(collectiviteTable.type, collectivite.type));
    switch (collectivite.type) {
      case collectiviteTypeEnum.EPCI:
        if (!collectivite.siren) return null;
        condition.push(eq(collectiviteTable.siren, collectivite.siren));
        break;

      case collectiviteTypeEnum.COMMUNE:
        if (!collectivite.communeCode) return null;
        condition.push(
          eq(collectiviteTable.communeCode, collectivite.communeCode)
        );
        break;

      case collectiviteTypeEnum.DEPARTEMENT:
        if (!collectivite.departementCode) return null;
        condition.push(
          eq(collectiviteTable.departementCode, collectivite.departementCode)
        );
        break;

      case collectiviteTypeEnum.REGION:
        if (!collectivite.regionCode) return null;
        condition.push(
          eq(collectiviteTable.regionCode, collectivite.regionCode)
        );
        break;

      case collectiviteTypeEnum.TEST:
        if (!collectivite.nom) return null;
        condition.push(eq(collectiviteTable.nom, collectivite.nom));
        break;
    }
    const [result] = (await this.databaseService.db
      .select()
      .from(collectiviteTable)
      .where(and(...condition))
      .limit(1)) as Collectivite[];
    return result ?? null;
  }

  /**
   * Récupère une collectivité via son id
   * @param collectiviteId
   */
  async select(collectiviteId: number): Promise<Collectivite | null> {
    const [result] = (await this.databaseService.db
      .select()
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1)) as Collectivite[];
    return result ?? null;
  }

  /**
   * Met à jour le NIC de chaque collectivité à partir de son SIREN
   */
  async updateNIC(inputs: CollectiviteUpdateNIC) {
    if (!inputs.length) {
      return;
    }

    const sqlChunks: SQL[] = [];
    const siren: string[] = [];
    sqlChunks.push(sql`(case`);
    for (const input of inputs) {
      sqlChunks.push(
        sql`when ${collectiviteTable.siren} = ${input.siren} then ${input.nic}`
      );
      siren.push(input.siren);
    }
    sqlChunks.push(sql`end)`);
    const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

    return this.databaseService.db
      .update(collectiviteTable)
      .set({ nic: finalSql })
      .where(inArray(collectiviteTable.siren, siren));
  }
}
