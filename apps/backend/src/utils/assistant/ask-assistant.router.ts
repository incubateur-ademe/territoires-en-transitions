import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { askAssistantFromCrispInputSchema } from './ask-assistant-from-crisp.input';
import { AskAssistantFromCrispService } from './ask-assistant-from-crisp.service';
import { askAssistantErrorConfig } from './ask-assistant.errors';
import { askAssistantInputSchema } from './ask-assistant.input';
import { AskAssistantService } from './ask-assistant.service';

@Injectable()
export class AssistantRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    askAssistantErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly askAssistantService: AskAssistantService,
    private readonly askAssistantFromCrispService: AskAssistantFromCrispService
  ) {}

  router = this.trpc.router({
    /**
     * Pose une question à l'assistant (outils du serveur MCP, modèle de
     * `LLM_PROVIDER`). Réservé aux porteurs de `utils.mcp.read` ; l'historique
     * est tenu par l'appelant. Annulé si le client se déconnecte.
     */
    ask: this.trpc.authedProcedure
      .use(
        this.trpc.rateLimit({ name: 'assistant-ask', limit: 10, ttl: 60_000 })
      )
      .input(askAssistantInputSchema)
      .mutation(async ({ input, ctx: { user }, signal }) => {
        const result = await this.askAssistantService.ask(input, {
          user,
          signal,
        });
        return this.getResultDataOrThrowError(result);
      }),

    /**
     * `/tet` dans Crisp, appelé par `apps/tools` avec le jeton service : répond
     * au nom de l'opérateur, en lecture élevée, sur l'utilisateur de la
     * conversation.
     */
    askFromCrisp: this.trpc.serviceRoleProcedure
      .input(askAssistantFromCrispInputSchema)
      .mutation(async ({ input, signal }) => {
        const result = await this.askAssistantFromCrispService.askFromCrisp(
          input,
          { signal }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
