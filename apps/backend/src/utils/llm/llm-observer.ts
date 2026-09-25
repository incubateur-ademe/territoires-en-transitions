import { Injectable, Logger } from '@nestjs/common';
import { LlmError } from './llm.errors';
import { TokenUsage } from './token-usage';

/** Une tentative d'appel au modèle, réussie ou non. */
export type LlmCallEvent = {
  attempt: number;
  durationMs: number;
  promptChars: number;
  usage: TokenUsage | null;
  error: LlmError | null;
};

/**
 * Reçoit chaque tentative d'appel, y compris celles qui échouent sur un quota :
 * c'est ce qui permet de compter les 429 et de mesurer un import.
 */
export abstract class LlmObserver {
  abstract onCall(event: LlmCallEvent): void;
}

@Injectable()
export class LoggingLlmObserver extends LlmObserver {
  private readonly logger = new Logger(LlmObserver.name);

  onCall(event: LlmCallEvent): void {
    const outcome = event.error
      ? `error ${event.error.kind}`
      : `${event.usage?.totalTokens ?? 0} tokens`;
    this.logger.debug(
      `LLM call attempt ${event.attempt}: ${outcome} in ${event.durationMs} ms (prompt ${event.promptChars} chars)`
    );
  }
}
