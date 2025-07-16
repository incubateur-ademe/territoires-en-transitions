import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '@/backend/users/decorators/token-info.decorators';
import { AuthenticatedUser } from '@/backend/users/index-domain';
import { createZodDto } from '@anatine/zod-nestjs';
import {
  Controller,
  Get,
  Param,
  Query
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { getReferentielMultipleScoresRequestSchema } from '../models/get-referentiel-multiple-scores.request';
import { ReferentielId } from '../models/referentiel-id.enum';
import ScoresService from './scores.service';

class GetReferentielMultipleScoresRequestClass extends createZodDto(
  getReferentielMultipleScoresRequestSchema
) {}

@ApiTags('Referentiels')
@Controller('')
export class ReferentielsScoringController {
  constructor(
    private readonly scoresService: ScoresService,
  ) {}


  // utilisé par le bac à sable du référentiel TE
   @AllowAnonymousAccess()
   @ApiExcludeEndpoint() // Not in documentation
   @Get('referentiels/:referentiel_id/scores')
   async getReferentielMultipleScorings(
     @Param('referentiel_id') referentielId: ReferentielId,
      @Query() parameters: GetReferentielMultipleScoresRequestClass,
      @TokenInfo() tokenInfo: AuthenticatedUser
   ) {
     return await this.scoresService.computeScoreForMultipleCollectivite(
       referentielId,
       parameters,
       tokenInfo
     );
   }
}
