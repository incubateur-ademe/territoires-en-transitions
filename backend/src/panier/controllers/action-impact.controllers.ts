import { Controller, Get, Logger, Query } from '@nestjs/common';
import ActionImpactService from '../services/action-impact.service';
import { ActionImpactDetailsClass } from '../models/action-impact.table';
import { ApiResponse } from '@nestjs/swagger';

@Controller('actionImpact')
export class ActionImpactController {
  private readonly logger = new Logger(ActionImpactController.name);

  constructor(private readonly indicateurService: ActionImpactService) {}

  @Get('details')
  @ApiResponse({ type: ActionImpactDetailsClass })
  async fetchActionImpactDetails(
    @Query() request: { actionImpactId: number }
  ): Promise<ActionImpactDetailsClass | null> {
    return this.indicateurService.getActionImpactDetails(
      request.actionImpactId
    );
  }
}
