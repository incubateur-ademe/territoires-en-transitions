import { Injectable, Logger } from '@nestjs/common';
import { PosthogService } from '@/tools-automation-api/posthog/posthog.service';

@Injectable()
export default class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly posthogService : PosthogService
  ) {}

  async getViews(){
    return await this.posthogService.getPageViewEvents();
  }
}
