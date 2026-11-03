import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { CrispApiClient } from './crisp-api.client';
import { SUPPORT_ROLE_REQUIRED_MESSAGE } from './prepare-segment-tagging.service';
import { verifySegmentTaggingToken } from './segment-tagging-token.rules';
import { SupportCrispError } from './support-crisp.errors';
import { normalizeSegment } from './support-segments.rules';

export const applySegmentTaggingInputSchema = z.object({
  actionToken: z.string().min(1).max(20_000),
});
export type ApplySegmentTaggingInput = z.infer<
  typeof applySegmentTaggingInputSchema
>;

export type ApplySegmentTaggingOutput = {
  segment: string;
  ajoutes: number;
  dejaPresents: number;
  echecs: number;
};

const WRITE_CONCURRENCY = 4;

/**
 * Applique un ajout de segment préparé par l'assistant, sur confirmation de
 * l'utilisateur dans l'app : jamais déclenché par le modèle. Les segments de
 * chaque conversation sont relus juste avant d'écrire.
 */
@Injectable()
export class ApplySegmentTaggingService {
  private readonly logger = new Logger(ApplySegmentTaggingService.name);

  constructor(
    private readonly crispApiClient: CrispApiClient,
    private readonly permissionService: PermissionService,
    private readonly configService: ConfigurationService
  ) {}

  async run(
    input: ApplySegmentTaggingInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ApplySegmentTaggingOutput, SupportCrispError>> {
    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.mutate',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      return failure('UNAUTHORIZED', new Error(SUPPORT_ROLE_REQUIRED_MESSAGE));
    }
    const verified = verifySegmentTaggingToken(
      input.actionToken,
      this.configService.get('SUPABASE_JWT_SECRET'),
      Date.now()
    );
    if (!verified.ok) {
      return failure(verified.error);
    }
    const { action } = verified;
    if (action.userId !== user.id) {
      return failure('INVALID_TOKEN');
    }

    const wanted = normalizeSegment(action.segment);
    const output: ApplySegmentTaggingOutput = {
      segment: action.segment,
      ajoutes: 0,
      dejaPresents: 0,
      echecs: 0,
    };
    let index = 0;
    const worker = async () => {
      while (index < action.sessionIds.length) {
        const sessionId = action.sessionIds[index++];
        const current = await this.crispApiClient.getSegments(sessionId);
        if (!current.success) {
          output.echecs += 1;
          continue;
        }
        if (
          current.data.some((segment) => normalizeSegment(segment) === wanted)
        ) {
          output.dejaPresents += 1;
          continue;
        }
        const updated = await this.crispApiClient.updateSegments(sessionId, [
          ...current.data,
          action.segment,
        ]);
        if (updated.success) {
          output.ajoutes += 1;
        } else {
          output.echecs += 1;
          this.logger.warn(
            `Segment « ${action.segment} » not added to ${sessionId}: ${updated.cause?.message}`
          );
        }
      }
    };
    await Promise.all(
      Array.from({ length: WRITE_CONCURRENCY }, () => worker())
    );

    // Journal d'audit : qui a ajouté quel segment, et combien.
    this.logger.log(
      `Segment « ${action.segment} » added by ${user.id}: ${output.ajoutes} added, ${output.dejaPresents} already there, ${output.echecs} failed`
    );
    return success(output);
  }
}
