import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import { BibliothequeFichier } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { DocumentIndexerService } from '../document-indexer/document-indexer.service';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
import {
  UpdateDocumentError,
  UpdateDocumentErrorEnum,
} from './update-document.errors';

export type UpdateDocumentInput = {
  collectiviteId: number;
  hash: string;
  filename?: string;
  confidentiel?: boolean;
};

@Injectable()
export class UpdateDocumentService {
  private readonly logger = new Logger(UpdateDocumentService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly documentIndexerService: DocumentIndexerService
  ) {}

  async updateDocument(
    input: UpdateDocumentInput,
    user: AuthenticatedUser
  ): Promise<
    Result<BibliothequeFichier, UpdateDocumentError | 'UNAUTHORIZED'>
  > {
    const isAllowed = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.mutate',
      ResourceType.COLLECTIVITE,
      input.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    const existing = await this.databaseService.db
      .select()
      .from(bibliothequeFichierTable)
      .where(
        and(
          eq(bibliothequeFichierTable.collectiviteId, input.collectiviteId),
          eq(bibliothequeFichierTable.hash, input.hash)
        )
      )
      .limit(1);

    if (!existing.length) {
      return {
        success: false,
        error: UpdateDocumentErrorEnum.DOCUMENT_NOT_FOUND,
      };
    }

    const updatePayload: Partial<{
      filename: string;
      confidentiel: boolean;
    }> = {};
    if (input.filename !== undefined) {
      updatePayload.filename = input.filename;
    }
    if (input.confidentiel !== undefined) {
      updatePayload.confidentiel = input.confidentiel;
    }

    if (Object.keys(updatePayload).length === 0) {
      return {
        success: false,
        error: UpdateDocumentErrorEnum.NO_CHANGES_TO_MAKE,
      };
    }

    const [updated] = await this.databaseService.db
      .update(bibliothequeFichierTable)
      .set(updatePayload)
      .where(
        and(
          eq(bibliothequeFichierTable.collectiviteId, input.collectiviteId),
          eq(bibliothequeFichierTable.hash, input.hash)
        )
      )
      .returning();

    if (!updated) {
      return {
        success: false,
        error: UpdateDocumentErrorEnum.DOCUMENT_NOT_FOUND,
      };
    }

    this.logger.log(
      `Document ${input.hash} updated for collectivité ${input.collectiviteId}`
    );

    // Indexation Meilisearch : on enfile l'upsert APRÈS le commit pour ne
    // jamais indexer un état qui sera rollbacké. L'enqueue n'est utile que
    // quand le `filename` change (seul champ indexé) ; pour rester simple on
    // enfile sur tout update — `process()` rechargera la ligne canonique de
    // toute façon. L'enqueue est wrappé dans un try/catch + warn : une panne
    // BullMQ ne doit pas faire échouer l'update, la dérive est rattrapée par
    // le backfill admin (U8).
    if (input.filename !== undefined) {
      try {
        await this.documentIndexerService.enqueueUpsert(
          (updated as BibliothequeFichier).id
        );
      } catch (err) {
        this.logger.warn(
          `Échec de l'enqueue d'indexation pour le fichier ${
            (updated as BibliothequeFichier).id
          } : ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return {
      success: true,
      data: updated as BibliothequeFichier,
    };
  }
}
