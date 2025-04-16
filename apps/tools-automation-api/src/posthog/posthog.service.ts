import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@/tools-automation-api/config/configuration.service';

@Injectable()
export class PosthogService {
  private readonly logger = new Logger(PosthogService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly projectId : number = 12975; // production
  // private readonly tetID : number = 12931; // preprod

  constructor(private readonly configService: ConfigurationService) {
    this.apiKey = this.configService.get('POSTHOG_API_KEY');
    this.apiUrl = this.configService.get('POSTHOG_API_URL');
  }

  async getPageViewEvents() {

    const urlPageView = `${this.apiUrl}/api/projects/${this.projectId}/events/?event=$pageview`;
    const response = await fetch(urlPageView, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      },
    });

    return await response.json();
  }
}
