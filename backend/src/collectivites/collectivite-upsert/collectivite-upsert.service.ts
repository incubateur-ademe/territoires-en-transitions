import { Injectable, Logger } from '@nestjs/common';
import {
  Collectivite,
  CollectiviteUpsert,
  collectiviteTable,
} from '@/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@/backend/utils';
import { collectiviteTypeId } from '@/backend/collectivites/shared/models/collectivite-type.table';
import { banaticTable } from '@/backend/collectivites/shared/models/imports-banatic.table';
import { and, eq } from 'drizzle-orm';
import { importCommuneTable } from '@/backend/collectivites/shared/models/imports-commune.table';
import { departementTable } from '@/backend/collectivites/shared/models/imports-departement.table';
import { regionTable } from '@/backend/collectivites/shared/models/imports-region.table';

type colInfo = {
  nom: string | null;
  departementCode?: string | null;
  regionCode: string | null;
  population: number | null;
  natureInsee?: string | null;
};

@Injectable()
export default class CollectiviteUpsertService {
  private readonly logger = new Logger(CollectiviteUpsertService.name);

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
    const [result] = await this.databaseService.db
      .insert(collectiviteTable)
      .values(collectivite)
      .onConflictDoUpdate({
        target: [collectiviteTable.id],
        set: {
          ...rest,
          modifiedAt: new Date().toISOString(),
        },
      })
      .returning();
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

    switch (collectivite.typeId) {
      // Get more info from imports.banatic
      case collectiviteTypeId.EPCI:
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
      case collectiviteTypeId.Commune:
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
      case collectiviteTypeId.Departement:
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
      case collectiviteTypeId.Region:
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
      nom: collectivite.nom ?? info.nom,
      departementCode: collectivite.departementCode ?? info.departementCode,
      regionCode: collectivite.regionCode ?? info.regionCode,
      population: collectivite.population ?? info.population,
      natureInsee: collectivite.natureInsee ?? info.natureInsee,
    };
  }

  /**
   * Cherche si une collectivité existe déjà
   * @param collectivite
   */
  async find(collectivite: CollectiviteUpsert): Promise<Collectivite | null> {
    const condition = [];
    condition.push(eq(collectiviteTable.typeId, collectivite.typeId));
    switch (collectivite.typeId) {
      case collectiviteTypeId.EPCI:
        if (!collectivite.siren) return null;
        condition.push(eq(collectiviteTable.siren, collectivite.siren));
        break;

      case collectiviteTypeId.Commune:
        if (!collectivite.communeCode) return null;
        condition.push(
          eq(collectiviteTable.communeCode, collectivite.communeCode)
        );
        break;

      case collectiviteTypeId.Departement:
        if (!collectivite.departementCode) return null;
        condition.push(
          eq(collectiviteTable.departementCode, collectivite.departementCode)
        );
        break;

      case collectiviteTypeId.Region:
        if (!collectivite.regionCode) return null;
        condition.push(
          eq(collectiviteTable.regionCode, collectivite.regionCode)
        );
        break;

      case collectiviteTypeId.Test:
        if (!collectivite.nom) return null;
        condition.push(eq(collectiviteTable.nom, collectivite.nom));
        break;

    }
    const [result] = await this.databaseService.db
      .select()
      .from(collectiviteTable)
      .where(and(...condition))
      .limit(1);
    return result ?? null;
  }
}
