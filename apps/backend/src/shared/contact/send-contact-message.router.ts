import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { sendContactMessageErrorConfig } from './send-contact-message.errors';
import { sendContactMessageInputSchema } from './send-contact-message.input';
import { SendContactMessageService } from './send-contact-message.service';

/**
 * Nombre d'envois autorisés par IP et par fenêtre.
 *
 * Large pour un humain (qui soumet une fois, deux en cas d'erreur), étroit
 * pour un robot. C'est la seule barrière côté réseau : la procédure est
 * publique, l'ancienne edge function était au moins derrière la clé anon
 * Supabase.
 */
const CONTACT_RATE_LIMIT = { name: 'contact', limit: 5, ttl: 60_000 } as const;

@Injectable()
export class SendContactMessageRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly sendContactMessageService: SendContactMessageService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    sendContactMessageErrorConfig
  );

  router = this.trpc.router({
    send: this.trpc.publicProcedure
      .use(this.trpc.rateLimit(CONTACT_RATE_LIMIT))
      .input(sendContactMessageInputSchema)
      .mutation(async ({ input }) => {
        const result = await this.sendContactMessageService.sendContactMessage(
          input
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
