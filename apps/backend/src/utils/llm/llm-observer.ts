import { Injectable, Logger } from '@nestjs/common';
import { describeLlmError, LlmError } from './llm.errors';
import { LlmTier } from './llm-tier';
import { TokenUsage } from './token-usage';

/** Une tentative d'appel au modèle, réussie ou non. */
export type LlmCallEvent = {
  tier: LlmTier;
  /** Modèle effectivement appelé ; le palier à défaut de modèle configuré. */
  model: string;
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
    const timing = `in ${event.durationMs} ms (prompt ${event.promptChars} chars)`;
    if (event.error) {
      const error = describeLlmError(event.error);
      this.logger.warn(
        `LLM call attempt ${event.attempt} to ${event.model}: error ${error} ${timing}`
      );
      return;
    }
    const tokens = event.usage?.totalTokens ?? 0;
    this.logger.debug(
      `LLM call attempt ${event.attempt}: ${tokens} tokens ${timing}`
    );
  }
}
