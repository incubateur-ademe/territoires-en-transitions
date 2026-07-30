import { Injectable, Logger } from '@nestjs/common';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';

export const creerSessionErrors = ['GENERATE_LINK_ERROR'] as const;
export type CreateSupabaseSessionError = (typeof creerSessionErrors)[number];

/**
 * Pont vers une session Supabase standard :
 * `generateLink({type:'magiclink'})` n'envoie AUCUN email et
 * retourne `properties.hashed_token` ; côté app, `verifyOtp({type:'email',
 * token_hash})` rendra une session avec un vrai refresh token GoTrue.
 */
@Injectable()
export class CreateSupabaseSessionService {
  private readonly logger = new Logger(CreateSupabaseSessionService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async creerSession(
    email: string
  ): Promise<Result<{ hashedToken: string }, CreateSupabaseSessionError>> {
    const { data, error } =
      await this.supabaseService.client.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });

    if (error) {
      this.logger.error(
        `Echec de generateLink pour la création de session: ${error.message}`
      );
      return failure('GENERATE_LINK_ERROR');
    }

    const hashedToken = data?.properties?.hashed_token;
    if (!hashedToken) {
      this.logger.error(
        'generateLink a répondu sans hashed_token, impossible de créer la session'
      );
      return failure('GENERATE_LINK_ERROR');
    }

    return success({ hashedToken });
  }
}
