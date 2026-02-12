import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  MattermostBotService,
  MattermostCommand,
} from './mattermost-bot.service';

@Controller('mattermost')
export class MattermostController {
  private readonly logger = new Logger(MattermostController.name);

  constructor(private readonly mattermostBotService: MattermostBotService) {}

  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader?: string
  ) {
    // Verify the request is from Mattermost
    if (!this.verifyMattermostRequest(authHeader)) {
      throw new UnauthorizedException('Invalid Mattermost request');
    }

    this.logger.log(`Received webhook: ${JSON.stringify(body)}`);

    // Handle different types of webhooks
    if (body.type === 'slash_command') {
      return await this.handleSlashCommand(body);
    }

    // Default response for other webhook types
    return { status: 'ok' };
  }

  @Post('command')
  async handleSlashCommand(@Body() command: MattermostCommand) {
    try {
      const response = await this.mattermostBotService.handleCommand(command);
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error handling slash command: ${errorMessage}`);
      return {
        response_type: 'ephemeral',
        text: `❌ Error: ${errorMessage}`,
      };
    }
  }

  private verifyMattermostRequest(authHeader?: string): boolean {
    // In production, you should verify the request signature
    // For now, we'll accept all requests (you should implement proper verification)
    // You can use the token from your Mattermost slash command configuration
    return true;
  }
}
