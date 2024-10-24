import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  arrayOverlaps,
  count,
  eq,
  getTableColumns,
  gte,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import { AuthService } from '../../auth/services/auth.service';
import { CountSyntheseType } from '../../common/models/count-synthese.dto';
import { getModifiedSinceDate } from '../../common/models/modified-since.enum';
import DatabaseService from '../../common/services/database.service';
import { axeTable } from '../models/axe.table';
import { ficheActionAxeTable } from '../models/fiche-action-axe.table';
import { ficheActionPartenaireTagTable } from '../models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '../models/fiche-action-pilote.table';
import { ficheActionServiceTagTable } from '../models/fiche-action-service.table';
import {
  CreateFicheActionType,
  FicheActionStatutsEnumType,
  ficheActionTable,
  SANS_STATUT_FICHE_ACTION_SYNTHESE_KEY,
} from '../models/fiche-action.table';
import { GetFichesActionSyntheseResponseType } from '../models/get-fiches-action-synthese.response';
import { GetFichesActionFilterRequestType } from '../models/get-fiches-actions-filter.request';
import { UpdateFicheActionRequestType } from '../models/update-fiche-action.request';

@Injectable()
export default class FichesActionSyntheseService {
  private readonly logger = new Logger(FichesActionSyntheseService.name);

  private readonly FICHE_ACTION_PARTENAIRE_TAGS_QUERY_ALIAS =
    'ficheActionPartenaireTags';
  private readonly FICHE_ACTION_PARTENAIRE_TAGS_QUERY_FIELD =
    'partenaire_tag_ids';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService
  ) {}

  async getFichesActionSynthese(
    collectiviteId: number,
    filter: GetFichesActionFilterRequestType,
    tokenInfo: SupabaseJwtPayload
  ): Promise<GetFichesActionSyntheseResponseType> {
    this.logger.log(
      `Récupération de la synthese des fiches action pour la collectivité ${collectiviteId}: filtre ${JSON.stringify(
        filter
      )}`
    );

    const listeValeurs = Object.values(FicheActionStatutsEnumType) as string[];
    const conditions = this.getConditions(collectiviteId, filter);
    const statutSynthese = await this.getSynthesePourPropriete(
      ficheActionTable.statut,
      conditions,
      listeValeurs,
      SANS_STATUT_FICHE_ACTION_SYNTHESE_KEY
    );

    const synthese: GetFichesActionSyntheseResponseType = {
      par_statut: statutSynthese,
    };
    return synthese;
  }

  getFicheActionPartenaireTagsQuery() {
    return this.databaseService.db
      .select({
        fiche_id: ficheActionPartenaireTagTable.fiche_id,
        partenaire_tag_ids:
          sql`array_agg(${ficheActionPartenaireTagTable.partenaire_tag_id})`.as(
            this.FICHE_ACTION_PARTENAIRE_TAGS_QUERY_FIELD
          ),
      })
      .from(ficheActionPartenaireTagTable)
      .groupBy(ficheActionPartenaireTagTable.fiche_id)
      .as(this.FICHE_ACTION_PARTENAIRE_TAGS_QUERY_ALIAS);
  }

  getFicheActionAxesQuery() {
    return this.databaseService.db
      .select({
        fiche_id: ficheActionAxeTable.fiche_id,
        axe_ids: sql`array_agg(${ficheActionAxeTable.axe_id})`.as('axe_ids'),
        plan_ids: sql`array_agg(${axeTable.plan})`.as('plan_ids'),
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axe_id))
      .groupBy(ficheActionAxeTable.fiche_id)
      .as('ficheActionAxes');
  }

  getFicheActionServiceTagsQuery() {
    return this.databaseService.db
      .select({
        fiche_id: ficheActionServiceTagTable.fiche_id,
        service_tag_ids:
          sql`array_agg(${ficheActionServiceTagTable.service_tag_id})`.as(
            'service_tag_ids'
          ),
      })
      .from(ficheActionServiceTagTable)
      .groupBy(ficheActionServiceTagTable.fiche_id)
      .as('ficheActionServiceTag');
  }

  getFicheActionPilotesQuery() {
    return this.databaseService.db
      .select({
        fiche_id: ficheActionPiloteTable.fiche_id,
        pilote_user_ids:
          sql`array_remove(array_agg(${ficheActionPiloteTable.user_id}), NULL)`.as(
            'pilote_user_ids'
          ),
        pilote_tag_ids:
          sql`array_remove(array_agg(${ficheActionPiloteTable.tag_id}), NULL)`.as(
            'pilote_tag_ids'
          ),
      })
      .from(ficheActionPiloteTable)
      .groupBy(ficheActionPiloteTable.fiche_id)
      .as('ficheActionPilotes');
  }

  async getFichesAction(
    collectiviteId: number,
    filter: GetFichesActionFilterRequestType,
    tokenInfo: SupabaseJwtPayload
  ): Promise<any> {
    this.logger.log(
      `Récupération des fiches action pour la collectivité ${collectiviteId}: filtre ${JSON.stringify(
        filter
      )}`
    );

    const ficheActionPartenaireTags = this.getFicheActionPartenaireTagsQuery();
    const ficheActionPilotes = this.getFicheActionPilotesQuery();
    const ficheActionServiceTags = this.getFicheActionServiceTagsQuery();
    const ficheActionAxes = this.getFicheActionAxesQuery();

    const conditions = this.getConditions(collectiviteId, filter);

    const fichesActionQuery = this.databaseService.db
      .select({
        ...getTableColumns(ficheActionTable),
        partenaire_tag_ids: ficheActionPartenaireTags.partenaire_tag_ids,
        pilote_tag_ids: ficheActionPilotes.pilote_tag_ids,
        pilote_user_ids: ficheActionPilotes.pilote_user_ids,
        service_tag_ids: ficheActionServiceTags.service_tag_ids,
        axe_ids: ficheActionAxes.axe_ids,
        plan_ids: ficheActionAxes.plan_ids,
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPartenaireTags,
        eq(ficheActionPartenaireTags.fiche_id, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionPilotes,
        eq(ficheActionPilotes.fiche_id, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionServiceTags,
        eq(ficheActionServiceTags.fiche_id, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionAxes,
        eq(ficheActionAxes.fiche_id, ficheActionTable.id)
      )
      .where(and(...conditions));

    return await fichesActionQuery;
  }

  getConditions(
    collectiviteId: number,
    filter: GetFichesActionFilterRequestType
  ): (SQLWrapper | SQL)[] {
    const conditions: (SQLWrapper | SQL)[] = [
      eq(ficheActionTable.collectiviteId, collectiviteId),
    ];
    if (filter.cibles?.length) {
      conditions.push(arrayOverlaps(ficheActionTable.cibles, filter.cibles));
    }
    if (filter.modified_since) {
      const modifiedSinceDate = getModifiedSinceDate(filter.modified_since);
      conditions.push(
        gte(ficheActionTable.modifiedAt, modifiedSinceDate.toISOString())
      );
    }
    if (filter.modified_after) {
      conditions.push(gte(ficheActionTable.modifiedAt, filter.modified_after));
    }
    if (filter.partenaire_tag_ids?.length) {
      // Vraiment étrange, probable bug de drizzle, on le peut pas lui donner le tableau directement
      const sqlNumberArray = `{${filter.partenaire_tag_ids.join(',')}}`;
      conditions.push(
        arrayOverlaps(sql`partenaire_tag_ids`, sql`${sqlNumberArray}`)
      );
    }
    if (filter.service_tag_ids?.length) {
      // Vraiment étrange, probable bug de drizzle, on le peut pas lui donner le tableau directement
      const sqlNumberArray = `{${filter.service_tag_ids.join(',')}}`;
      conditions.push(
        arrayOverlaps(sql`service_tag_ids`, sql`${sqlNumberArray}`)
      );
    }
    if (filter.plan_ids?.length) {
      // Vraiment étrange, probable bug de drizzle, on le peut pas lui donner le tableau directement
      const sqlNumberArray = `{${filter.plan_ids.join(',')}}`;
      conditions.push(arrayOverlaps(sql`plan_ids`, sql`${sqlNumberArray}`));
    }

    const piloteConditions: (SQLWrapper | SQL)[] = [];
    if (filter.pilote_user_ids?.length) {
      const sqlNumberArray = `{${filter.pilote_user_ids.join(',')}}`;
      piloteConditions.push(
        arrayOverlaps(sql`pilote_user_ids`, sql`${sqlNumberArray}`)
      );
    }
    if (filter.pilote_tag_ids?.length) {
      const sqlNumberArray = `{${filter.pilote_tag_ids.join(',')}}`;
      piloteConditions.push(
        arrayOverlaps(sql`pilote_tag_ids`, sql`${sqlNumberArray}`)
      );
    }
    if (piloteConditions.length) {
      if (piloteConditions.length === 1) {
        conditions.push(piloteConditions[0]);
      } else {
        conditions.push(or(...piloteConditions)!);
      }
    }

    return conditions;
  }

  async getSynthesePourPropriete(
    propriete: PgColumn,
    conditions: (SQLWrapper | SQL)[],
    listeValeurs?: string[],
    nullValue?: string
  ): Promise<CountSyntheseType> {
    const ficheActionPartenaireTags = this.getFicheActionPartenaireTagsQuery();
    const ficheActionPilotes = this.getFicheActionPilotesQuery();
    const ficheActionServiceTags = this.getFicheActionServiceTagsQuery();
    const ficheActionAxes = this.getFicheActionAxesQuery();

    if (listeValeurs && nullValue && !listeValeurs.includes(nullValue)) {
      listeValeurs.push(nullValue);
    }

    const fichesActionSyntheseQuery = this.databaseService.db
      .select({
        valeur: propriete,
        count: count(),
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPartenaireTags,
        eq(ficheActionPartenaireTags.fiche_id, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionPilotes,
        eq(ficheActionPilotes.fiche_id, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionServiceTags,
        eq(ficheActionServiceTags.fiche_id, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionAxes,
        eq(ficheActionAxes.fiche_id, ficheActionTable.id)
      )
      .where(and(...conditions))
      .groupBy(propriete);
    const fichesActionSynthese = await fichesActionSyntheseQuery;

    const synthese: CountSyntheseType = {};
    if (listeValeurs) {
      listeValeurs.forEach((valeur) => {
        synthese[valeur] = {
          valeur: valeur,
          count: 0,
        };
      });
    }
    fichesActionSynthese.forEach((syntheseRow) => {
      synthese[syntheseRow.valeur || nullValue] = {
        valeur: syntheseRow.valeur || nullValue,
        count: syntheseRow.count,
      };
    });

    return synthese;
  }
}
