import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import { createZodDto } from 'nestjs-zod';
import { levierGesErrorConfig } from './levier-ges.errors';
import { solveLevierGesRequestSchema } from './solve-levier-ges.request';
import { solveLevierGesResponseSchema } from './solve-levier-ges.response';
import { SolveLevierGesService } from './solve-levier-ges.service';

class SolveLevierGesRequestClass extends createZodDto(
  solveLevierGesRequestSchema
) {}

class SolveLevierGesResponseClass extends createZodDto(
  solveLevierGesResponseSchema
) {}

@ApiTags('PlanET')
@ApiBearerAuth()
@Controller('planet')
export class SolveLevierGesController {
  private readonly getResultDataOrThrow =
    createControllerErrorHandler(levierGesErrorConfig);

  constructor(private readonly solveLevierGesService: SolveLevierGesService) {}

  @Post('solutions')
  @HttpCode(HttpStatus.OK)
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOperation({
    summary:
      "Valeur d'un paramètre d'un levier de décarbonation qui évite une réduction cible de CO2e par an",
    description:
      "Calcul inverse de l'estimation : les autres paramètres de la requête restent fixés. Chaque appel relance l'estimation plusieurs centaines de fois au plus, à réserver à une recherche ponctuelle.",
  })
  @ApiOkResponse({ type: SolveLevierGesResponseClass })
  @ApiBadRequestResponse({
    description:
      "Corps de requête invalide (format de validation commun à l'API), ou levier, paramètre cherché ou cible invalides (détail dans `message`)",
  })
  @ApiNotFoundResponse({ description: 'Territoire inconnu' })
  @ApiUnprocessableEntityResponse({
    description:
      "Cible hors d'atteinte, paramètre dont la réduction n'est pas monotone, levier non calculé à ce niveau, ou territoire sans donnée",
  })
  solve(
    @Body() request: SolveLevierGesRequestClass
  ): SolveLevierGesResponseClass {
    return this.getResultDataOrThrow(this.solveLevierGesService.solve(request));
  }
}
