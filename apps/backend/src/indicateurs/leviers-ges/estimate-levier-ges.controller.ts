import { Body, Controller, Post } from '@nestjs/common';
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
import { createZodDto } from 'nestjs-zod';
import { estimateLevierGesRequestSchema } from './estimate-levier-ges.request';
import { estimateLevierGesResponseSchema } from './estimate-levier-ges.response';
import { EstimateLevierGesService } from './estimate-levier-ges.service';
import { toLeviersGesHttpException } from './to-leviers-ges-http-exception';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
export class EstimateLevierGesRequestClass extends createZodDto(
  estimateLevierGesRequestSchema
) {}

export class EstimateLevierGesResponseClass extends createZodDto(
  estimateLevierGesResponseSchema
) {}

@ApiTags('Leviers GES')
@ApiBearerAuth()
@Controller('leviers-ges')
export class EstimateLevierGesController {
  constructor(private readonly estimateLevierGesService: EstimateLevierGesService) {}

  @Post('estimations')
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOperation({
    summary:
      "Estimation des tonnes de CO2e évitées par an par un levier de décarbonation, pour une région, un département ou un EPCI",
    description:
      "Méthodes de calcul du tableur ADEME PlanET V1. Il s'agit d'estimations : restituer systématiquement les `limits` et `appliedAssumptions` renvoyées avec le résultat.",
  })
  @ApiOkResponse({ type: EstimateLevierGesResponseClass })
  @ApiBadRequestResponse({
    description: 'Levier inconnu ou paramètres invalides (détail dans `issues`)',
  })
  @ApiNotFoundResponse({ description: 'Territoire inconnu' })
  @ApiUnprocessableEntityResponse({
    description:
      "Levier non calculé à ce niveau, ou territoire sans donnée (par exemple l'outre-mer)",
  })
  estimate(
    @Body() request: EstimateLevierGesRequestClass
  ): EstimateLevierGesResponseClass {
    const result = this.estimateLevierGesService.estimate(request);
    if (!result.success) {
      throw toLeviersGesHttpException(result.error);
    }
    return result.data;
  }
}
