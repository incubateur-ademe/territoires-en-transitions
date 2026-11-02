import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';
import {
  findUserInputSchema,
  findUserOutputSchema,
  FindUserService,
} from './find-user.service';

@Injectable()
export class FindUserTool implements McpTool {
  constructor(private readonly findUserService: FindUserService) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'find_user',
      {
        title: 'Retrouver un utilisateur par son e-mail',
        description:
          "Donne le prénom, le nom, l'état du compte et les collectivités d'un utilisateur (niveau d'accès, fonction, référent), à partir de son e-mail. Ne renvoie que les collectivités que l'appelant peut lire. Ni e-mail ni téléphone en sortie.",
        inputSchema: findUserInputSchema,
        outputSchema: findUserOutputSchema,
        annotations: READ_ONLY_TOOL_ANNOTATIONS,
      },
      async (input) =>
        toToolResult(await this.findUserService.run(input, { user }))
    );
  }
}
