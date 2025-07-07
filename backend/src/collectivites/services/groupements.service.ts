import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../utils/database/database.service';
import {
    CreateGroupementCollectiviteType,
    groupementCollectiviteTable,
} from '../shared/models/groupement-collectivite.table';
import { groupementTable } from '../shared/models/groupement.table';

@Injectable()
export default class GroupementsService {
  private readonly logger = new Logger(GroupementsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getGroupementAvecNom(nom: string) {
    this.logger.log(`Récupération du groupement avec le nom ${nom}`);
    const groupementResult = await this.databaseService.db
      .select()
      .from(groupementTable)
      .where(eq(groupementTable.nom, nom));
    if (!groupementResult?.length) {
      throw new NotFoundException(`Groupement avec le nom ${nom} introuvable`);
    }

    if (groupementResult.length > 1) {
      throw new HttpException(
        `Plusieurs groupements trouvés avec le nom ${nom}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    this.logger.log(`Groupement trouvé avec l'id ${groupementResult[0].id}`);
    return groupementResult[0];
  }

  async ajouteCollectiviteAuGroupement(
    groupementId: number,
    collectiviteId: number
  ) {
    this.logger.log(
      `Ajout de la collectivite ${collectiviteId} au groupement ${groupementId}`
    );
    const createGroupementCollectivite: CreateGroupementCollectiviteType = {
      collectiviteId,
      groupementId: groupementId,
    };

    await this.databaseService.db
      .insert(groupementCollectiviteTable)
      .values(createGroupementCollectivite)
      .onConflictDoNothing();
  }
}
