import { Injectable, Logger } from '@nestjs/common';
import { GetLabellisationService } from '@tet/backend/referentiels/labellisations/get-labellisation.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  referentielIdEnumSchema,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { GetReferentielService } from '../../get-referentiel/get-referentiel.service';
import { BuildArchiveService } from '../build-archive/build-archive.service';
import { ListAuditPreuvesService } from '../list-audit-preuves/list-audit-preuves.service';
import {
  AuditPreuvesArchiveStatusEnum,
  type AuditPreuvesArchive,
} from '../models/audit-preuves-archive.table';
import { PreuvesArchiveRepository } from '../preuves-archive.repository';
import {
  generateArchiveFolderArborescence,
  type ArchiveFolderArborescence,
  type ReferentielTreeNode,
} from './generate-archive-folder-arborescence';

interface JobContext {
  user: AuthenticatedUser;
  demandeId: number;
  referentielId: ReferentielId;
}

/**
 * `retryable` distingue une panne d'infra transitoire (Supabase/réseau/disque,
 * que BullMQ doit relancer) d'une erreur logique définitive (permission révoquée,
 * référentiel invalide, audit/archive introuvable, qu'il est inutile de retenter).
 * Le worker traduit ce flag en `Error` (retry) ou `UnrecoverableError` (terminal).
 */
export interface GenerateArchiveFailure {
  message: string;
  retryable: boolean;
}

type GenerateArchiveResult = Result<undefined, GenerateArchiveFailure>;

function retryableFailure(
  message: string
): Result<never, GenerateArchiveFailure> {
  return failure({ message, retryable: true });
}

function nonRetryableFailure(
  message: string
): Result<never, GenerateArchiveFailure> {
  return failure({ message, retryable: false });
}

function buildRequesterUser(userId: string): AuthenticatedUser {
  return {
    id: userId,
    role: AuthRole.AUTHENTICATED,
    isAnonymous: false,
    jwtPayload: { role: AuthRole.AUTHENTICATED },
  };
}

function parseReferentielId(
  raw: string
): Result<ReferentielId, GenerateArchiveFailure> {
  const parsed = referentielIdEnumSchema.safeParse(raw);
  if (!parsed.success) {
    return nonRetryableFailure(`Référentiel ${raw} invalide`);
  }
  return success(parsed.data);
}

@Injectable()
export class GeneratePreuvesArchiveService {
  private readonly logger = new Logger(GeneratePreuvesArchiveService.name);

  constructor(
    private readonly repository: PreuvesArchiveRepository,
    private readonly listAuditPreuvesService: ListAuditPreuvesService,
    private readonly getReferentielService: GetReferentielService,
    private readonly buildArchiveService: BuildArchiveService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly permissions: PermissionService
  ) {}

  /**
   * Ne marque jamais la ligne `failed` : c'est `markFailed` (appelé par le
   * worker au dernier échec uniquement) qui le fait, sinon la ligne clignoterait
   * `failed` entre deux retries. Sur succès la ligne passe `completed` ici.
   */
  async generate(archiveId: string): Promise<GenerateArchiveResult> {
    const archiveResult = await this.repository.getByIdRaw(archiveId);
    if (!archiveResult.success) {
      return nonRetryableFailure(`Archive ${archiveId} introuvable`);
    }
    const archive = archiveResult.data;

    // Ré-livraison stalled d'un job déjà terminé : no-op, pas de second upload.
    if (archive.status === AuditPreuvesArchiveStatusEnum.COMPLETED) {
      this.logger.log(
        `Archive ${archiveId} déjà completed — ré-livraison ignorée`
      );
      return success(undefined);
    }

    this.logger.log(`Génération de l'archive de preuves ${archiveId}`);

    const transition = await this.repository.transitionToProcessing(archiveId);
    if (!transition.success) {
      return retryableFailure(
        `Passage en statut processing échoué pour ${archiveId}: ${transition.error}`
      );
    }

    const contextResult = await this.resolveJobContext(archive);
    if (!contextResult.success) {
      return contextResult;
    }

    const arborescenceResult = await this.buildArborescence(
      archive,
      contextResult.data
    );
    if (!arborescenceResult.success) {
      return arborescenceResult;
    }

    return this.uploadAndComplete(archiveId, arborescenceResult.data);
  }

  /**
   * Marque la ligne `failed` une fois les tentatives BullMQ épuisées (ou sur
   * crash worker stalled). Libère l'index unique partiel pour que l'utilisateur
   * puisse relancer.
   */
  async markFailed(archiveId: string, message: string): Promise<void> {
    const result = await this.repository.markFailed(archiveId, message);
    if (!result.success) {
      this.logger.error(
        `Marquage failed échoué pour ${archiveId}: ${result.error}`
      );
    }
  }

  private async resolveJobContext(
    archive: AuditPreuvesArchive
  ): Promise<Result<JobContext, GenerateArchiveFailure>> {
    const user = buildRequesterUser(archive.requestedBy);

    const stillAllowed = await this.permissions.isAllowed(
      user,
      'referentiels.read',
      ResourceType.COLLECTIVITE,
      archive.collectiviteId,
      true
    );
    if (!stillAllowed) {
      return nonRetryableFailure(
        `L'utilisateur ${archive.requestedBy} n'a plus le droit referentiels.read sur la collectivité ${archive.collectiviteId}`
      );
    }

    const demandeIdResult = await this.resolveDemandeId(archive.auditId);
    if (!demandeIdResult.success) {
      return demandeIdResult;
    }

    const referentielIdResult = parseReferentielId(archive.referentielId);
    if (!referentielIdResult.success) {
      return referentielIdResult;
    }

    return success({
      user,
      demandeId: demandeIdResult.data,
      referentielId: referentielIdResult.data,
    });
  }

  private async resolveDemandeId(
    auditId: number
  ): Promise<Result<number, GenerateArchiveFailure>> {
    try {
      const auditDetails = await this.getLabellisationService.getAudit(auditId);
      if (!auditDetails.success) {
        return nonRetryableFailure(`Audit ${auditId} introuvable`);
      }
      const demandeId = auditDetails.data.demandeId;
      if (demandeId == null) {
        return nonRetryableFailure(
          `Aucune demande de labellisation rattachée à l'audit ${auditId}`
        );
      }
      return success(demandeId);
    } catch (error) {
      // L'accès DB peut tomber transitoirement : laisser BullMQ relancer.
      return retryableFailure(
        `Résolution de la demande échouée: ${getErrorMessage(error)}`
      );
    }
  }

  private async buildArborescence(
    archive: AuditPreuvesArchive,
    context: JobContext
  ): Promise<Result<ArchiveFolderArborescence, GenerateArchiveFailure>> {
    const preuvesResult = await this.listAuditPreuvesService.list({
      collectiviteId: archive.collectiviteId,
      referentielId: context.referentielId,
      auditId: archive.auditId,
      demandeId: context.demandeId,
      user: context.user,
    });
    if (!preuvesResult.success) {
      return retryableFailure(
        `Liste des preuves échouée: ${preuvesResult.error}`
      );
    }

    const treeResult = await this.fetchReferentielTree(context.referentielId);
    if (!treeResult.success) {
      return treeResult;
    }

    const arborescenceResult = generateArchiveFolderArborescence({
      preuves: preuvesResult.data,
      referentielTree: treeResult.data,
    });
    if (!arborescenceResult.success) {
      // Arbre/préuves cohérents mais arborescence impossible : défaut de données.
      return nonRetryableFailure(
        `Construction de l'arborescence échouée: ${arborescenceResult.error}`
      );
    }
    return success(arborescenceResult.data);
  }

  private async fetchReferentielTree(
    referentielId: ReferentielId
  ): Promise<Result<ReferentielTreeNode, GenerateArchiveFailure>> {
    try {
      const tree = await this.getReferentielService.getReferentielTree(
        referentielId
      );
      return success(tree.itemsTree);
    } catch (error) {
      return retryableFailure(
        `Récupération de l'arbre du référentiel échouée: ${getErrorMessage(error)}`
      );
    }
  }

  private async uploadAndComplete(
    archiveId: string,
    arborescence: ArchiveFolderArborescence
  ): Promise<GenerateArchiveResult> {
    const totalFiles = arborescence.files.length;
    const totalResult = await this.repository.updateProgress(archiveId, {
      processedFiles: 0,
      totalFiles,
    });
    if (!totalResult.success) {
      this.logger.warn(
        `Publication de total_files échouée pour ${archiveId}: ${totalResult.error}`
      );
    }

    const storagePath = `${archiveId}.zip`;
    const buildResult = await this.buildArchiveService.buildAndUpload({
      archiveId,
      arborescence,
      storagePath,
      onProgress: (processedFiles) => {
        void this.persistProgress(archiveId, processedFiles, totalFiles);
      },
    });
    if (!buildResult.success) {
      return retryableFailure(
        `Construction de l'archive échouée: ${buildResult.error}`
      );
    }

    const completedResult = await this.repository.markCompleted(
      archiveId,
      storagePath
    );
    if (!completedResult.success) {
      return retryableFailure(
        `Passage en statut completed échoué pour ${archiveId}: ${completedResult.error}`
      );
    }

    this.logger.log(`Archive de preuves ${archiveId} générée avec succès`);
    return success(undefined);
  }

  private async persistProgress(
    archiveId: string,
    processedFiles: number,
    totalFiles: number
  ): Promise<void> {
    const result = await this.repository.updateProgress(archiveId, {
      processedFiles,
      totalFiles,
    });
    if (!result.success) {
      this.logger.warn(
        `Mise à jour de la progression échouée pour ${archiveId}: ${result.error}`
      );
    }
  }
}
