import { Module } from '@nestjs/common';
import { UsersModule } from '@tet/backend/users/users.module';
import { LlmModule } from '@tet/backend/utils/llm/llm.module';
import { McpModule } from '@tet/backend/utils/mcp/mcp.module';
import { AskAssistantFromCrispService } from './ask-assistant-from-crisp.service';
import { AssistantRouter } from './ask-assistant.router';
import { AskAssistantService } from './ask-assistant.service';

@Module({
  imports: [UsersModule, LlmModule, McpModule],
  providers: [
    AskAssistantService,
    AskAssistantFromCrispService,
    AssistantRouter,
  ],
  exports: [AskAssistantService, AssistantRouter],
})
export class AssistantModule {}
