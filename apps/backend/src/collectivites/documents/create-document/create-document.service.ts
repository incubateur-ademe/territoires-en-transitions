import { collectiviteBucketTable } from '@/backend/collectivites/shared/models/collectivite-bucket.table';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import {
  BibliothequeFichier,
  BibliothequeFichierCreate,
} from '@/domain/collectivites';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
import { storageObjectTable } from '../models/storage-object.table';

@Injectable()
export class CreateDocumentService {
  private readonly logger = new Logger(CreateDocumentService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  async createDocument(
    document: BibliothequeFichierCreate,
    user: AuthenticatedUser
  ): Promise<BibliothequeFichier> {
    this.logger.log(
      `Création du document ${document.filename} pour la collectivité ${document.collectiviteId}`
    );

    await this.permissionService.isAllowed(
      user,
      'collectivites.documents.create',
      ResourceType.COLLECTIVITE,
      document.collectiviteId,
      true
    );

    const existingStorageObject = await this.databaseService.db
      .select({ id: storageObjectTable.id })
      .from(storageObjectTable)
      .innerJoin(
        collectiviteBucketTable,
        eq(collectiviteBucketTable.bucketId, storageObjectTable.bucketId)
      )
      .where(
        and(
          eq(collectiviteBucketTable.collectiviteId, document.collectiviteId),
          eq(storageObjectTable.name, document.hash)
        )
      )
      .limit(1);

    if (!existingStorageObject.length) {
      throw new NotFoundException(
        `Fichier non trouvé pour la collectivité ${document.collectiviteId} et le hash ${document.hash}`
      );
    }

    const [insertedDocument] = await this.databaseService.db
      .insert(bibliothequeFichierTable)
      .values({
        collectiviteId: document.collectiviteId,
        hash: document.hash,
        filename: document.filename,
        confidentiel: document.confidentiel ?? false,
      })
      .returning();

    if (!insertedDocument) {
      throw new InternalServerErrorException(
        `Erreur lors de la création du document ${document.filename}`
      );
    }

    return insertedDocument;
  }
}
