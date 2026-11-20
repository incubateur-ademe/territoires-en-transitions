import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import {
  PreuvesArchiveErrorEnum,
  type PreuvesArchiveError,
} from '../preuves-archive.errors';
import { type DocumentScopeKind } from '@tet/backend/collectivites/documents/list-documents-by-scope/document-scope';
import { ListDocumentsByScopeRepository } from '@tet/backend/collectivites/documents/list-documents-by-scope/list-documents-by-scope.repository';
import { type CollectedDocuments } from '@tet/backend/collectivites/documents/list-documents-by-scope/triage-documents';

export interface PreuvesByOrigin {
  mesure: CollectedDocuments;
  demande: CollectedDocuments;
  audit: CollectedDocuments;
}

interface CollectAuditPreuvesInput {
  collectiviteId: number;
  referentielId: ReferentielId;
  /** `null` sans audit ou sans demande : la section correspondante reste vide. */
  demandeId: number | null;
  auditId: number | null;
  user: AuthenticatedUser;
}

const NO_DOCUMENTS = success<CollectedDocuments>({
  files: [],
  missingFiles: [],
  links: [],
});

@Injectable()
export class CollectAuditPreuvesService {
  private readonly logger = new Logger(CollectAuditPreuvesService.name);

  constructor(
    private readonly documents: ListDocumentsByScopeRepository,
    private readonly permissions: PermissionService
  ) {}

  async collect(
    input: CollectAuditPreuvesInput
  ): Promise<Result<PreuvesByOrigin, PreuvesArchiveError>> {
    const { collectiviteId, referentielId, demandeId, auditId, user } = input;

    const canReadConfidentielResult = await this.permissions.isAllowed(
      user,
      'collectivites.documents.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    const canReadConfidentiel = canReadConfidentielResult.success;

    const [complementaire, reglementaire, labellisation, audit] =
      await Promise.all([
        this.documents.listDocuments({
          kind: 'complementaire',
          collectiviteId,
          referentielId,
          canReadConfidentiel,
        }),
        this.documents.listDocuments({
          kind: 'reglementaire',
          collectiviteId,
          referentielId,
          canReadConfidentiel,
        }),
        demandeId === null
          ? NO_DOCUMENTS
          : this.documents.listDocuments({
              kind: 'labellisation',
              collectiviteId,
              demandeId,
              canReadConfidentiel,
            }),
        auditId === null
          ? NO_DOCUMENTS
          : this.documents.listDocuments({
              kind: 'audit',
              collectiviteId,
              auditId,
              canReadConfidentiel,
            }),
      ]);

    if (!complementaire.success) {
      return this.scopeFailure({
        kind: 'complementaire',
        input,
        cause: complementaire.cause,
      });
    }
    if (!reglementaire.success) {
      return this.scopeFailure({
        kind: 'reglementaire',
        input,
        cause: reglementaire.cause,
      });
    }
    if (!labellisation.success) {
      return this.scopeFailure({
        kind: 'labellisation',
        input,
        cause: labellisation.cause,
      });
    }
    if (!audit.success) {
      return this.scopeFailure({
        kind: 'audit',
        input,
        cause: audit.cause,
      });
    }

    return success({
      mesure: {
        files: [...complementaire.data.files, ...reglementaire.data.files],
        missingFiles: [
          ...complementaire.data.missingFiles,
          ...reglementaire.data.missingFiles,
        ],
        links: [...complementaire.data.links, ...reglementaire.data.links],
      },
      demande: labellisation.data,
      audit: audit.data,
    });
  }

  private scopeFailure({
    kind,
    input: { collectiviteId, referentielId, demandeId, auditId },
    cause,
  }: {
    kind: DocumentScopeKind;
    input: CollectAuditPreuvesInput;
    cause?: Error;
  }): Result<never, PreuvesArchiveError> {
    this.logger.error(
      `Failed to collect the ${kind} documents (collectivite ${collectiviteId}, referentiel ${referentielId}, demande ${
        demandeId ?? 'none'
      }, audit ${auditId ?? 'none'})`
    );
    return failure(PreuvesArchiveErrorEnum.COLLECT_PREUVES_ERROR, cause);
  }
}
