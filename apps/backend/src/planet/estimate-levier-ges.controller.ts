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
import { createZodDto } from 'nestjs-zod';
import { estimateLevierGesRequestSchema } from './estimate-levier-ges.request';
import { estimateLevierGesResponseSchema } from './estimate-levier-ges.response';
import { EstimateLevierGesService } from './estimate-levier-ges.service';
import { toLeviersGesHttpException } from './to-leviers-ges-http-exception';

export class EstimateLevierGesRequestClass extends createZodDto(
  estimateLevierGesRequestSchema
) {}

export class EstimateLevierGesResponseClass extends createZodDto(
  estimateLevierGesResponseSchema
) {}

@ApiTags('PlanET')
@ApiBearerAuth()
@Controller('planet')
export class EstimateLevierGesController {
  constructor(
    private readonly estimateLevierGesService: EstimateLevierGesService
  ) {}

  @Post('estimations')
  @HttpCode(HttpStatus.OK)
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOperation({
    summary:
      'Estimation des tonnes de CO2e évitées par an par un levier de décarbonation, pour une région, un département ou un EPCI',
    description:
      "Méthodes de calcul du tableur ADEME PlanET V1. Il s'agit d'estimations : restituer systématiquement les `limits` et `appliedAssumptions` renvoyées avec le résultat.",
  })
  @ApiOkResponse({ type: EstimateLevierGesResponseClass })
  @ApiBadRequestResponse({
    description:
      "Corps de requête invalide (format de validation commun à l'API), ou levier inconnu / paramètres du levier invalides (détail dans `issues`)",
  })
  @ApiNotFoundResponse({ description: 'Territoire inconnu' })
  @ApiUnprocessableEntityResponse({
    description:
      "Levier non calculé à ce niveau, ou territoire sans donnée (par exemple l'outre-mer)",
  })
  estimate(
    @Body() request: EstimateLevierGesRequestClass
  ): EstimateLevierGesResponseClass {
    const estimation = this.estimateLevierGesService.estimate(request);
    if (!estimation.success) {
      throw toLeviersGesHttpException(estimation.error);
    }
    return estimation.data;
  }
}
