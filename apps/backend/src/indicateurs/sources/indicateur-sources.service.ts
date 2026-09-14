import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import {
  IndicateurSourceCreate,
  IndicateurSourceMetadonnee,
  IndicateurSourceMetadonneeCreate,
} from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { GetAvailableSourcesRequestSchemaRequestType } from './get-available-sources.request';
import { IndicateurSourcesRepository } from './indicateur-sources.repository';

@Injectable()
export default class IndicateurSourcesService {
  private readonly logger = new Logger(IndicateurSourcesService.name);

  constructor(
    private readonly repository: IndicateurSourcesRepository,
    private readonly permissionService: PermissionService
  ) {}

  async createIndicateurSourceMetadonnee(
    indicateurSourceMetadonneeType: IndicateurSourceMetadonneeCreate
  ) {
    this.logger.log(
      `Création de la metadonnees pour la source d'indicateur ${indicateurSourceMetadonneeType.sourceId} et la date ${indicateurSourceMetadonneeType.dateVersion}`
    );
    return this.repository.createMetadonnee(indicateurSourceMetadonneeType);
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

  async getIndicateurSourceMetadonnee(
    sourceId: string,
    dateVersion: string
  ): Promise<IndicateurSourceMetadonnee | null> {
    this.logger.log(
      `Récupération de la metadonnees pour la source d'indicateur ${sourceId} et la date ${dateVersion}`
    );
    return this.repository.getMetadonnee(sourceId, dateVersion);
  }

  async upsertIndicateurSource(indicateurSource: IndicateurSourceCreate) {
    this.logger.log(`Upsert de la source d'indicateur ${indicateurSource.id}`);
    return this.repository.upsertSource(indicateurSource);
  }

  async getAllSources() {
    this.logger.log('Liste toutes les sources de données');
    return this.repository.listSources();
  }

  async getAvailableSources(
    input: GetAvailableSourcesRequestSchemaRequestType,
    { user }: Pick<ServiceSecondArg, 'user'>
  ) {
    const { collectiviteId, indicateurId } = input;
    await this.permissionService.assertAllowed(
      user,
      'indicateurs.valeurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );

    this.logger.log(
      `Liste les sources de données disponibles pour l'indicateur ${indicateurId} et la collectivité ${collectiviteId}`
    );
    return this.repository.listAvailableSources(input);
  }
}
