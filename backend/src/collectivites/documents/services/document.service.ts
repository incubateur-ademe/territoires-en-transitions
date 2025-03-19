import { COLLECTIVITE_ID_ROUTE_PARAM } from '@/backend/collectivites/shared/models/collectivite-api.constants';
import { ReferentielId } from '@/backend/referentiels/index-domain';
import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  asc,
  eq,
  getTableColumns,
  like,
  lte,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { DatabaseService } from '../../../utils/database/database.service';
import { bibliothequeFichierTable } from '../models/bibliotheque-fichier.table';
import { DOCUMENT_ID_ROUTE_PARAM } from '../models/document-api.constants';
import { preuveActionTable } from '../models/preuve-action.table';
import { preuveComplementaireTable } from '../models/preuve-complementaire.table';
import { preuveReglementaireDefinitionTable } from '../models/preuve-reglementaire-definition.table';
import { preuveReglementaireTable } from '../models/preuve-reglementaire.table';
import { PreuveTypeEnum } from '../models/preuve-type.enum';
import { PreuveDto } from '../models/preuve.dto';

@Injectable()
export default class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private static DOWNLOAD_ROUTE = `collectivites/${COLLECTIVITE_ID_ROUTE_PARAM}/documents/${DOCUMENT_ID_ROUTE_PARAM}/download`;

  constructor(private readonly databaseService: DatabaseService) {}

  getDownloadUrl(host: string, collectiviteId: number, fichierId: number) {
    return `${host}/api/v1/${DocumentService.DOWNLOAD_ROUTE.replace(
      COLLECTIVITE_ID_ROUTE_PARAM,
      collectiviteId.toString()
    ).replace(DOCUMENT_ID_ROUTE_PARAM, fichierId.toString())}`;
  }

  async getActionPreuves(
    collectiviteId: number,
    referentielId: ReferentielId,
    modifiedBeforeDate?: string
  ) {
    const preuves = (
      await Promise.all([
        this.getPreuvesReglementaires(
          collectiviteId,
          referentielId,
          modifiedBeforeDate
        ),
        this.getPreuvesComplementaires(
          collectiviteId,
          referentielId,
          modifiedBeforeDate
        ),
      ])
    ).flat();
    this.logger.log(
      `Found ${preuves.length} action preuves for collectivite ${collectiviteId} and referentiel ${referentielId} before date ${modifiedBeforeDate}`
    );

    const actionIdPreuves: { [actionId: string]: PreuveDto[] } = {};
    preuves.forEach((preuve) => {
      if (preuve.actionId) {
        if (!actionIdPreuves[preuve.actionId]) {
          actionIdPreuves[preuve.actionId] = [];
        }
        actionIdPreuves[preuve.actionId].push(preuve);
      }
    });
    return actionIdPreuves;
  }

  async getPreuvesReglementaires(
    collectiviteId: number,
    referentielId: ReferentielId,
    modifiedBeforeDate?: string
  ): Promise<PreuveDto[]> {
    const conditions: (SQLWrapper | SQL)[] = [
      eq(preuveReglementaireTable.collectiviteId, collectiviteId),
      like(preuveActionTable.actionId, `${referentielId}%`),
    ];
    if (modifiedBeforeDate) {
      conditions.push(
        lte(preuveReglementaireTable.modifiedAt, modifiedBeforeDate)
      );
    }

    const preuvesQuery = this.databaseService.db
      .select({
        ...getTableColumns(bibliothequeFichierTable),
        ...getTableColumns(preuveReglementaireTable),
        nom: preuveReglementaireDefinitionTable.nom,
        description: preuveReglementaireDefinitionTable.description,
        actionId: preuveActionTable.actionId,
        preuveType: sql`${PreuveTypeEnum.REGLEMENTAIRE}`,
      })
      .from(preuveReglementaireTable)
      .leftJoin(
        preuveReglementaireDefinitionTable,
        eq(
          preuveReglementaireDefinitionTable.id,
          preuveReglementaireTable.preuveId
        )
      )
      .leftJoin(
        preuveActionTable,
        eq(preuveActionTable.preuveId, preuveReglementaireTable.preuveId)
      )
      .leftJoin(
        bibliothequeFichierTable,
        eq(preuveReglementaireTable.fichierId, bibliothequeFichierTable.id)
      )
      .where(and(...conditions))
      .orderBy(asc(bibliothequeFichierTable.filename));

    const preuves = (await preuvesQuery) as PreuveDto[];

    this.logger.log(
      `Found ${preuves.length} preuves reglementaires for collectivite ${collectiviteId} and referentiel ${referentielId} before date ${modifiedBeforeDate}`
    );

    return preuves;
  }

  async getPreuvesComplementaires(
    collectiviteId: number,
    referentielId: ReferentielId,
    modifiedBeforeDate?: string
  ): Promise<PreuveDto[]> {
    const conditions: (SQLWrapper | SQL)[] = [
      eq(preuveComplementaireTable.collectiviteId, collectiviteId),
      like(preuveComplementaireTable.actionId, `${referentielId}%`),
    ];
    if (modifiedBeforeDate) {
      conditions.push(
        lte(preuveComplementaireTable.modifiedAt, modifiedBeforeDate)
      );
    }

    const preuves = (await this.databaseService.db
      .select({
        ...getTableColumns(bibliothequeFichierTable),
        ...getTableColumns(preuveComplementaireTable),
        preuveType: sql`${PreuveTypeEnum.COMPLEMENTAIRE}`,
      })
      .from(preuveComplementaireTable)
      .leftJoin(
        bibliothequeFichierTable,
        eq(preuveComplementaireTable.fichierId, bibliothequeFichierTable.id)
      )
      .where(and(...conditions))
      .orderBy(asc(bibliothequeFichierTable.filename))) as PreuveDto[];

    this.logger.log(
      `Found ${preuves.length} preuves complementaires for collectivite ${collectiviteId} and referentiel ${referentielId} before date ${modifiedBeforeDate}`
    );

    return preuves as PreuveDto[];
  }
}
