import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { AllowPublicAccess } from '../../auth/decorators/allow-public-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import { getPersonnalisationConsequencesRequestSchema } from '../models/get-personnalisation-consequences.request';
import { getPersonnalitionConsequencesResponseSchema } from '../models/get-personnalisation-consequences.response';
import { getPersonnalisationReglesRequestSchema } from '../models/get-personnalisation-regles.request';
import { getPersonnalisationReglesResponseSchema } from '../models/get-personnalisation-regles.response';
import { getPersonnalisationReponsesRequestSchema } from '../models/get-personnalisation-reponses.request';
import { getPersonnalitionReponsesResponseSchema } from '../models/get-personnalisation-reponses.response';
import PersonnalisationService from '../services/personnalisations-service';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
class GetPersonnalitionReponsesResponseClass extends createZodDto(
  getPersonnalitionReponsesResponseSchema
) {}
class GetPersonnalitionReponsesQueryClass extends createZodDto(
  getPersonnalisationReponsesRequestSchema
) {}
class GetPersonnalitionConsequencesQueryClass extends createZodDto(
  getPersonnalisationConsequencesRequestSchema
) {}

class GetPersonnalitionConsequencesResponseClass extends createZodDto(
  getPersonnalitionConsequencesResponseSchema
) {}

class GetPersonnalisationReglesRequestClass extends createZodDto(
  getPersonnalisationReglesRequestSchema
) {}

class GetPersonnalisationReglesResponseClass extends createZodDto(
  getPersonnalisationReglesResponseSchema
) {}

@ApiTags('Personnalisations')
@Controller('')
export class PersonnalisationsController {
  private readonly logger = new Logger(PersonnalisationsController.name);

  constructor(
    private readonly personnalisationsService: PersonnalisationService
  ) {}

  @AllowPublicAccess()
  @Get('personnalisations/regles')
  @ApiResponse({ type: GetPersonnalisationReglesResponseClass })
  async getPersonnalisationRegles(
    @Query() request: GetPersonnalisationReglesRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<GetPersonnalisationReglesResponseClass> {
    return this.personnalisationsService.getPersonnalisationRegles(
      request.referentiel
    );
  }

  @AllowAnonymousAccess()
  @Get('collectivites/:collectivite_id/personnalisations/reponses')
  @ApiResponse({ type: GetPersonnalitionReponsesResponseClass })
  async getPersonnalisationReponses(
    @Param('collectivite_id') collectiviteId: number,
    @Query() request: GetPersonnalitionReponsesQueryClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<GetPersonnalitionReponsesResponseClass> {
    return this.personnalisationsService.getPersonnalisationReponses(
      collectiviteId,
      request.date,
      tokenInfo
    );
  }

  @AllowAnonymousAccess()
  @Get('collectivites/:collectivite_id/personnalisations/consequences')
  @ApiResponse({ type: GetPersonnalitionConsequencesResponseClass })
  async getPersonnalisationConsequences(
    @Param('collectivite_id') collectiviteId: number,
    @Query() request: GetPersonnalitionConsequencesQueryClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<GetPersonnalitionConsequencesResponseClass> {
    return this.personnalisationsService.getPersonnalisationConsequencesForCollectivite(
      collectiviteId,
      request,
      tokenInfo
    );
  }
}
