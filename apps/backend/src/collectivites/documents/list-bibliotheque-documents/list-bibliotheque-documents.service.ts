import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { CollectiviteDocumentsAccessService } from '../collectivite-documents-access.service';
import {
  ListBibliothequeDocumentsError,
  ListBibliothequeDocumentsErrorEnum,
} from './list-bibliotheque-documents.errors';
import { ListBibliothequeDocumentsInput } from './list-bibliotheque-documents.input';
import { ListBibliothequeDocumentsOutput } from './list-bibliotheque-documents.output';
import { ListBibliothequeDocumentsRepository } from './list-bibliotheque-documents.repository';

@Injectable()
export class ListBibliothequeDocumentsService {
  constructor(
    private readonly collectiviteDocumentsAccess: CollectiviteDocumentsAccessService,
    private readonly repository: ListBibliothequeDocumentsRepository
  ) {}

  async listBibliothequeDocuments(
    { collectiviteId, search, limit }: ListBibliothequeDocumentsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<ListBibliothequeDocumentsOutput, ListBibliothequeDocumentsError>
  > {
    const accessResult =
      await this.collectiviteDocumentsAccess.checkUserCanReadDocuments(
        { collectiviteId },
        { user, tx }
      );
    if (!accessResult.success) {
      return failure(ListBibliothequeDocumentsErrorEnum.UNAUTHORIZED);
    }

    const documentsResult = await this.repository.listBibliothequeDocuments(
      {
        collectiviteId,
        search,
        limit,
        canReadConfidentiel: accessResult.data.canReadConfidentiel,
      },
      tx
    );
    if (!documentsResult.success) {
      return documentsResult;
    }

    return success({ items: documentsResult.data });
  }
}
