import {
  collectiviteBanaticSubType,
  CollectiviteBanaticType,
  collectiviteBanaticTypeTable,
} from '@/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import {
  CollectiviteAvecType,
  CollectivitePopulationTypeEnum,
  CollectiviteSousTypeEnum,
  CollectiviteTypeEnum,
} from '../identite-collectivite.dto';
import {
  Collectivite,
  collectiviteTable,
  collectiviteTypeEnum,
} from '../shared/models/collectivite.table';
import { regionTable } from '../shared/models/imports-region.table';

@Injectable()
export default class CollectivitesService {
  private readonly logger = new Logger(CollectivitesService.name);

  private readonly POPULATION_BORNES_SUP = [
    3000, 5000, 10000, 20000, 50000, 100000,
  ];
  private readonly POPULATION_BORNES_INF = [
    3000, 20000, 50000, 100000, 300000, 800000,
  ];

  constructor(private readonly databaseService: DatabaseService) {}

  getPopulationTags(population?: number): CollectivitePopulationTypeEnum[] {
    const populationTags: CollectivitePopulationTypeEnum[] = [];
    if (isNil(population)) {
      return populationTags;
    }
    this.POPULATION_BORNES_SUP.forEach((borneSup) => {
      if (population < borneSup) {
        populationTags.push(
          `moins_de_${borneSup}` as CollectivitePopulationTypeEnum
        );
      }
    });
    this.POPULATION_BORNES_INF.forEach((borneInf) => {
      if (population > borneInf) {
        populationTags.push(
          `plus_de_${borneInf}` as CollectivitePopulationTypeEnum
        );
      }
    });

    return populationTags;
  }

  getCollectiviteSousType(
    collectivite: Collectivite,
    typeBanatic: CollectiviteBanaticType | null
  ): CollectiviteSousTypeEnum | null {
    if (
      collectivite.type == collectiviteTypeEnum.EPCI &&
      typeBanatic &&
      (typeBanatic.type == collectiviteBanaticSubType.SyndicatMixte ||
        typeBanatic.type == collectiviteBanaticSubType.SyndicatCommunes)
    ) {
      return CollectiviteSousTypeEnum.SYNDICAT;
    }
    return null;
  }

  async getCollectiviteAvecType(
    collectiviteId: number
  ): Promise<CollectiviteAvecType> {
    const collectivite = await this.getCollectivite(collectiviteId);

    const collectivitePopulation: number | undefined =
      collectivite.collectivite.population ?? undefined;

    const collectiviteTest: boolean =
      collectivite.collectivite.type === collectiviteTypeEnum.TEST;

    const collectiviteEPCI: boolean =
      collectivite.collectivite.type === collectiviteTypeEnum.EPCI;

    return {
      ...(collectivite.collectivite as Collectivite),
      // TODO "doublon" avec typeId
      type:
        collectiviteTest || collectiviteEPCI
          ? CollectiviteTypeEnum.EPCI
          : CollectiviteTypeEnum.COMMUNE,
      soustype: this.getCollectiviteSousType(
        collectivite.collectivite as Collectivite,
        collectivite.collectivite_banatic_type
      ),
      populationTags: this.getPopulationTags(collectivitePopulation),
      // A bit weird, but it's the same as sql for now: if collectivite test, metropole if epci, null if commune
      drom:
        collectivite.region?.drom ||
        (collectiviteTest && !collectiviteEPCI ? null : false),
      test: collectiviteTest,
    };
  }

  async getCollectivite(collectiviteId: number) {
    this.logger.log(
      `Récupération de la collectivite avec l'identifiant ${collectiviteId}`
    );

    const collectiviteByIdResult = await this.databaseService.db
      .select()
      .from(collectiviteTable)
      .leftJoin(
        collectiviteBanaticTypeTable,
        eq(collectiviteTable.natureInsee, collectiviteBanaticTypeTable.id)
      )
      .leftJoin(regionTable, eq(collectiviteTable.regionCode, regionTable.code))
      .where(eq(collectiviteTable.id, collectiviteId));

    if (!collectiviteByIdResult?.length) {
      throw new NotFoundException(
        `Collectivité avec l'identifiant ${collectiviteId} introuvable`
      );
    }
    return collectiviteByIdResult[0];
  }

  async getEpciByCollectiviteId(collectiviteId: number) {
    this.logger.log(
      `Récupération de l'epci avec l'identifiant ${collectiviteId}`
    );
    const epciByIdResult = await this.databaseService.db
      .select()
      .from(collectiviteTable)
      .where(
        and(
          eq(collectiviteTable.id, collectiviteId),
          eq(collectiviteTable.type, collectiviteTypeEnum.EPCI)
        )
      );
    if (!epciByIdResult?.length) {
      throw new NotFoundException(
        `EPCI avec l'identifiant de collectivite ${collectiviteId} introuvable`
      );
    }

    this.logger.log(`Epci trouvé avec l'id ${epciByIdResult[0].id}`);
    return epciByIdResult[0];
  }

  async getEpciBySiren(siren: string) {
    this.logger.log(`Récupération de l'epci à partir du siren ${siren}`);
    const epciBySirenResult = await this.databaseService.db
      .select()
      .from(collectiviteTable)
      .where(
        and(
          eq(collectiviteTable.siren, siren),
          eq(collectiviteTable.type, collectiviteTypeEnum.EPCI)
        )
      );
    if (!epciBySirenResult?.length) {
      throw new NotFoundException(`EPCI avec le siren ${siren} introuvable`);
    }
    this.logger.log(`Epci trouvé avec l'id ${epciBySirenResult[0].id}`);
    return epciBySirenResult[0];
  }

  async isPrivate(collectiviteId: number): Promise<boolean> {
    const collectivite = await this.getCollectivite(collectiviteId);
    return collectivite.collectivite.accessRestreint || false;
  }
}
