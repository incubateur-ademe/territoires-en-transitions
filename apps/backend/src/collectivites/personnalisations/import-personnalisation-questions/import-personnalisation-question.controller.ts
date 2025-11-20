import { Controller, Get, Logger } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import ImportPersonnalisationQuestionService from '@tet/backend/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.service';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { AllowAnonymousAccess } from '../../../users/decorators/allow-anonymous-access.decorator';

@ApiTags('Referentiels')
@ApiExcludeController()
@Controller('personnalisation-questions')
export class ImportPersonnalisationQuestionController {
  private readonly logger = new Logger(
    ImportPersonnalisationQuestionController.name
  );

  constructor(
    private readonly importPersonnalisationQuestionService: ImportPersonnalisationQuestionService
  ) {}

  @AllowAnonymousAccess()
  @Get('import')
  @ApiUsage([ApiUsageEnum.GOOGLE_SHEETS])
  async importPersonnalisationQuestions() {
    return this.importPersonnalisationQuestionService.importPersonnalisationQuestions();
  }
}
