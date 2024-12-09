import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { getPersonnalitionReponsesResponseSchema } from '../get-personnalisation-reponses.response';
import { getPersonnalisationReponsesRequestSchema } from '../get-personnalisation-reponses.request';
import { getPersonnalisationConsequencesRequestSchema } from '../get-personnalisation-consequences.request';
import { getPersonnalitionConsequencesResponseSchema } from '../get-personnalisation-consequences.response';
import { getPersonnalisationReglesRequestSchema } from '../get-personnalisation-regles.request';
import { getPersonnalisationReglesResponseSchema } from '../get-personnalisation-regles.response';
import PersonnalisationsService from '../services/personnalisations-service';
import {
  AllowPublicAccess,
  AuthenticatedUser,
  TokenInfo,
} from '@/backend/auth';
import { AllowAnonymousAccess } from '@/backend/auth/decorators/allow-anonymous-access.decorator';

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
    private readonly personnalisationsService: PersonnalisationsService
  ) {}

  @AllowPublicAccess()
  @Get('personnalisations/regles')
  @ApiResponse({ type: GetPersonnalisationReglesResponseClass })
  async getPersonnalisationRegles(
    @Query() request: GetPersonnalisationReglesRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
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
    @TokenInfo() tokenInfo: AuthenticatedUser
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
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetPersonnalitionConsequencesResponseClass> {
    const personnalisationConsequencesResult =
      await this.personnalisationsService.getPersonnalisationConsequencesForCollectivite(
        collectiviteId,
        request,
        tokenInfo
      );
    return personnalisationConsequencesResult.consequences;
  }
}
