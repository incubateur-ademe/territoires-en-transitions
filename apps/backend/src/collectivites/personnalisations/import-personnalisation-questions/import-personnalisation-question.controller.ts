import ImportPersonnalisationQuestionService from '@/backend/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.service';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Controller, Get, Logger } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
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
