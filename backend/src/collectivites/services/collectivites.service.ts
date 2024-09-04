import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { aliasedTable, eq, or } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import {
  banaticTable,
  CollectiviteAvecType,
  CollectivitePopulationTypeEnum,
  CollectiviteSousTypeEnum,
  collectiviteTable,
  CollectiviteTypeEnum,
  communeTable,
  CommuneType,
  epciTable,
  EpciType,
  importCommuneTable,
  regionTable,
} from '../models/collectivite.models';

@Injectable()
export default class CollectivitesService {
  private readonly logger = new Logger(CollectivitesService.name);

  private readonly POPULATION_BORNES_SUP = [10000, 20000, 50000, 100000];
  private readonly POPULATION_BORNES_INF = [20000, 100000];

  constructor(private readonly databaseService: DatabaseService) {}

  getPopulationTags(population?: number): CollectivitePopulationTypeEnum[] {
    const populationTags: CollectivitePopulationTypeEnum[] = [];
    if (!population) {
      return populationTags;
    }
    this.POPULATION_BORNES_SUP.forEach((borneSup) => {
      if (population < borneSup) {
        populationTags.push(
          `moins_de_${borneSup}` as CollectivitePopulationTypeEnum,
        );
      }
    });
    this.POPULATION_BORNES_INF.forEach((borneInf) => {
      if (population > borneInf) {
        populationTags.push(
          `plus_de_${borneInf}` as CollectivitePopulationTypeEnum,
        );
      }
    });
    return populationTags;
  }

  getCollectiviteSousType(collectivite: {
    epci: EpciType | null;
    commune: CommuneType | null;
  }): CollectiviteSousTypeEnum | null {
    if (collectivite.epci) {
      if (
        collectivite.epci.nature === 'SMF' ||
        collectivite.epci.nature === 'SIVOM' ||
        collectivite.epci.nature === 'SMO' ||
        collectivite.epci.nature === 'SIVU'
      ) {
        return CollectiviteSousTypeEnum.SYNDICAT;
      }
    }
    return null;
  }

  async getCollectiviteAvecType(
    collectiviteId: number,
  ): Promise<CollectiviteAvecType> {
    const collectivite = await this.getCollectivite(collectiviteId);
    return {
      ...collectivite.banatic,
      // @ts-ignore: TODO: fix this, pourquoi manque dans drizzle à cause de la jointure?
      ...collectivite.import_commune,
      ...collectivite.commune,
      ...collectivite.epci,
      ...collectivite.collectivite,
      type: collectivite.epci
        ? CollectiviteTypeEnum.EPCI
        : CollectiviteTypeEnum.COMMUNE,
      soustype: this.getCollectiviteSousType(collectivite),
      population_tags: this.getPopulationTags(
        collectivite.commune?.population ||
          // @ts-ignore: TODO: fix this, pourquoi manque dans drizzle à cause de la jointure?
          collectivite.import_commune?.population ||
          collectivite.banatic?.population,
      ),
      drom: collectivite.region?.drom || false,
    };
  }

  async getCollectivite(collectiviteId: number) {
    this.logger.log(
      `Récupération de la collectivite avec l'identifiant ${collectiviteId}`,
    );

    const importCommuneAliasedTable = aliasedTable(
      importCommuneTable,
      'import_commune',
    );
    const collectiviteByIdResult = await this.databaseService.db
      .select()
      .from(collectiviteTable)
      .leftJoin(
        communeTable,
        eq(communeTable.collectivite_id, collectiviteTable.id),
      )
      .leftJoin(epciTable, eq(epciTable.collectivite_id, collectiviteTable.id))
      .leftJoin(banaticTable, eq(banaticTable.siren, epciTable.siren))
      .leftJoin(
        importCommuneAliasedTable,
        eq(importCommuneAliasedTable.code, communeTable.code),
      )
      .leftJoin(
        regionTable,
        or(
          eq(regionTable.code, banaticTable.region_code),
          eq(regionTable.code, importCommuneAliasedTable.region_code),
        ),
      )
      .where(eq(collectiviteTable.id, collectiviteId));

    if (!collectiviteByIdResult?.length) {
      throw new NotFoundException(
        `Commune avec l'identifiant de collectivite ${collectiviteId} introuvable`,
      );
    }

    this.logger.log(
      `Commune trouvé avec l'id ${collectiviteByIdResult[0].collectivite.id}`,
    );
    return collectiviteByIdResult[0];
  }

  async getEpciByCollectiviteId(collectiviteId: number) {
    this.logger.log(
      `Récupération de l'epci avec l'identifiant ${collectiviteId}`,
    );
    const epciByIdResult = await this.databaseService.db
      .select()
      .from(epciTable)
      .where(eq(epciTable.collectivite_id, collectiviteId));
    if (!epciByIdResult?.length) {
      throw new NotFoundException(
        `EPCI avec l'identifiant de collectivite ${collectiviteId} introuvable`,
      );
    }

    this.logger.log(`Epci trouvé avec l'id ${epciByIdResult[0].id}`);
    return epciByIdResult[0];
  }

  async getEpciBySiren(siren: string) {
    this.logger.log(`Récupération de l'epci à partir du siren ${siren}`);
    const epciBySirenResult = await this.databaseService.db
      .select()
      .from(epciTable)
      .where(eq(epciTable.siren, siren));
    if (!epciBySirenResult?.length) {
      throw new NotFoundException(`EPCI avec le siren ${siren} introuvable`);
    }
    this.logger.log(`Epci trouvé avec l'id ${epciBySirenResult[0].id}`);
    return epciBySirenResult[0];
  }
}
