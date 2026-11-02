import { Injectable, Logger } from '@nestjs/common';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result } from '@tet/backend/utils/result.type';
import { eq, sql } from 'drizzle-orm';
import {
  AskAssistantFromCrispInput,
  askAssistantFromCrispInputSchema,
} from './ask-assistant-from-crisp.input';
import { AskAssistantError } from './ask-assistant.errors';
import { AskAssistantService, AssistantAnswer } from './ask-assistant.service';
import { buildCrispSupportUser } from './support-elevation';

/** Sous le délai de l'appel HTTP entre `apps/tools` et l'API. */
const CRISP_TIMEOUT_MS = 90_000;

/**
 * `/tet` dans Crisp : l'assistant répond au nom de l'opérateur, retrouvé par
 * son e-mail, en lecture élevée (cf. `support-elevation.ts`), avec le profil
 * et les derniers messages de l'utilisateur de la conversation.
 */
@Injectable()
export class AskAssistantFromCrispService {
  private readonly logger = new Logger(AskAssistantFromCrispService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly askAssistantService: AskAssistantService
  ) {}

  async askFromCrisp(
    rawInput: AskAssistantFromCrispInput,
    { signal }: { signal?: AbortSignal } = {}
  ): Promise<Result<AssistantAnswer, AskAssistantError>> {
    const input = askAssistantFromCrispInputSchema.parse(rawInput);
    const [operator] = await this.databaseService.db
      .select({ userId: dcpTable.id })
      .from(dcpTable)
      .where(
        eq(sql`lower(${dcpTable.email})`, input.operatorEmail.toLowerCase())
      )
      .limit(1);
    if (!operator) {
      return failure('OPERATOR_NOT_FOUND');
    }

    this.logger.log(`Crisp /tet asked by support user ${operator.userId}`);
    const result = await this.askAssistantService.ask(
      {
        question: input.question,
        history: input.history,
        mode: 'support',
        support: {
          visitorEmail: input.visitorEmail,
          visitorMessages: input.visitorMessages,
        },
      },
      {
        user: buildCrispSupportUser(operator.userId),
        signal,
        timeoutMs: CRISP_TIMEOUT_MS,
      }
    );
    if (!result.success && result.error === 'UNAUTHORIZED') {
      return failure('OPERATOR_NOT_SUPPORT');
    }
    return result;
  }
}
