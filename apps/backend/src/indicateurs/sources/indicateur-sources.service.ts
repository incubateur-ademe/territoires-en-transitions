import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  IndicateurSource,
  IndicateurSourceCreate,
  IndicateurSourceMetadonnee,
  IndicateurSourceMetadonneeCreate,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { GetAvailableSourcesRequestSchemaRequestType } from './get-available-sources.request';
import { TrajectoireSnbc3FeatureFlagService } from '../trajectoires/trajectoire-snbc3-feature-flag.service';
import { IndicateurSourcesRepository } from './indicateur-sources.repository';

@Injectable()
export default class IndicateurSourcesService {
  private readonly logger = new Logger(IndicateurSourcesService.name);

  constructor(
    private readonly repository: IndicateurSourcesRepository,
    private readonly permissionService: PermissionService,
    private readonly trajectoireSnbc3FeatureFlag: TrajectoireSnbc3FeatureFlagService
  ) {}

  async createIndicateurSourceMetadonnee(
    indicateurSourceMetadonneeType: IndicateurSourceMetadonneeCreate,
    tx?: Transaction
  ) {
    this.logger.log(
      `Création de la metadonnees pour la source d'indicateur ${indicateurSourceMetadonneeType.sourceId} et la date ${indicateurSourceMetadonneeType.dateVersion}`
    );
    return this.repository.createMetadonnee(indicateurSourceMetadonneeType, tx);
  }

  async getAllIndicateurSourceMetadonnees(
    tx?: Transaction
  ): Promise<IndicateurSourceMetadonnee[]> {
    this.logger.log(`Get all metadonnees for indicateur sources`);
    const indicateurSourceMetadonnees = await this.repository.listMetadonnees(
      tx
    );

    this.logger.log(
      `Found ${indicateurSourceMetadonnees.length} metadonnees for indicateur sources`
    );
    return indicateurSourceMetadonnees;
  }

  lockIndicateurSourceMetadonnee(metadonneeId: number, tx: Transaction) {
    return this.repository.lockMetadonnee(metadonneeId, tx);
  }

  async getIndicateurSourceMetadonnee(
    sourceId: string,
    dateVersion: string,
    tx?: Transaction
  ): Promise<IndicateurSourceMetadonnee | null> {
    this.logger.log(
      `Récupération de la metadonnees pour la source d'indicateur ${sourceId} et la date ${dateVersion}`
    );
    return this.repository.getMetadonnee(sourceId, dateVersion, tx);
  }

  async upsertIndicateurSource(
    indicateurSource: IndicateurSourceCreate,
    tx?: Transaction
  ) {
    this.logger.log(`Upsert de la source d'indicateur ${indicateurSource.id}`);
    return this.repository.upsertSource(indicateurSource, tx);
  }

  async getAllSources() {
    this.logger.log('Liste toutes les sources de données');
    return this.repository.listSources();
  }

  async getAvailableSources(
    input: GetAvailableSourcesRequestSchemaRequestType,
    { user }: Pick<ServiceSecondArg, 'user'>
  ): Promise<Result<IndicateurSource[], 'UNAUTHORIZED'>> {
    const { collectiviteId, indicateurId } = input;
    const permissionResult = await this.permissionService.isAllowed(
      user,
      'indicateurs.valeurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permissionResult.success) {
      return failure('UNAUTHORIZED');
    }

    this.logger.log(
      `Liste les sources de données disponibles pour l'indicateur ${indicateurId} et la collectivité ${collectiviteId}`
    );
    return success(
      await this.trajectoireSnbc3FeatureFlag.filterSourcesSnbc3(
        await this.repository.listAvailableSources(input),
        (source) => source.id,
        user,
        collectiviteId
      )
    );
  }
}
