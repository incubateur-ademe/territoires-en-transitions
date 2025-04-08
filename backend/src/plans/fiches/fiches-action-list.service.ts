import { dcpTable } from '@/backend/auth/index-domain';
import { annexeTable } from '@/backend/collectivites/documents/models/annexe.table';
import { bibliothequeFichierTable } from '@/backend/collectivites/documents/models/bibliotheque-fichier.table';
import {
  Collectivite,
  financeurTagTable,
  libreTagTable,
  partenaireTagTable,
  personneTagTable,
  serviceTagTable,
  structureTagTable,
} from '@/backend/collectivites/index-domain';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import {
  axeTable,
  ficheActionEffetAttenduTable,
  ficheActionFinanceurTagTable,
  ficheActionIndicateurTable,
  ficheActionLibreTagTable,
  ficheActionLienTable,
  ficheActionNoteTable,
  ficheActionPartenaireTagTable,
  ficheActionServiceTagTable,
  ficheActionSousThematiqueTable,
  ficheActionStructureTagTable,
  ficheActionTable,
  ficheActionThematiqueTable,
} from '@/backend/plans/fiches/index-domain';
import {
  GetFichesActionFilterRequestType,
  TypePeriodeEnumType,
} from '@/backend/plans/fiches/shared/fetch-fiches-filter.request';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { actionDefinitionTable } from '@/backend/referentiels/index-domain';
import {
  effetAttenduTable,
  sousThematiqueTable,
  tempsDeMiseEnOeuvreTable,
  thematiqueTable,
} from '@/backend/shared/index-domain';
import { DatabaseService } from '@/backend/utils';
import { getModifiedSinceDate } from '@/backend/utils/modified-since.enum';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  aliasedTable,
  and,
  arrayOverlaps,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import { ficheActionEtapeTable } from './fiche-action-etape/fiche-action-etape.table';
import { ficheActionActionTable } from './shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from './shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from './shared/models/fiche-action-pilote.table';
import {
  FicheActionWithRelationsAndCollectiviteType,
  FicheActionWithRelationsType,
} from './shared/models/fiche-action-with-relations.dto';

@Injectable()
export default class FicheActionListService {
  private readonly logger = new Logger(FicheActionListService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectiviteService: CollectivitesService
  ) {}

  private getFicheActionSousThematiquesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionSousThematiqueTable.ficheId,
        sousThematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionSousThematiqueTable.thematiqueId})`.as(
          'sous_thematique_ids'
        ),
        sousThematiques: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionSousThematiqueTable.thematiqueId}, 'nom', ${sousThematiqueTable.nom} ))`.as(
          'sous_thematiques'
        ),
      })
      .from(ficheActionSousThematiqueTable)
      .leftJoin(
        sousThematiqueTable,
        eq(sousThematiqueTable.id, ficheActionSousThematiqueTable.thematiqueId)
      )
      .groupBy(ficheActionSousThematiqueTable.ficheId)
      .as('ficheActionSousThematiques');
  }

  private getFicheActionThematiquesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionThematiqueTable.ficheId,
        thematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionThematiqueTable.thematiqueId})`.as(
          'thematique_ids'
        ),
        thematiques: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionThematiqueTable.thematiqueId}, 'nom', ${thematiqueTable.nom} ))`.as(
          'thematiques'
        ),
      })
      .from(ficheActionThematiqueTable)
      .leftJoin(
        thematiqueTable,
        eq(thematiqueTable.id, ficheActionThematiqueTable.thematiqueId)
      )
      .groupBy(ficheActionThematiqueTable.ficheId)
      .as('ficheActionThematiques');
  }

  private getFicheActionIndicateursQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionIndicateurTable.ficheId,
        thematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionIndicateurTable.indicateurId})`.as(
          'indicateur_ids'
        ),
        indicateurs: sql<
          { id: number; nom: string; unite: string }[]
        >`array_agg(json_build_object('id', ${ficheActionIndicateurTable.indicateurId}, 'nom', ${indicateurDefinitionTable.titre}, 'unite', ${indicateurDefinitionTable.unite} ))`.as(
          'indicateurs'
        ),
      })
      .from(ficheActionIndicateurTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(
          indicateurDefinitionTable.id,
          ficheActionIndicateurTable.indicateurId
        )
      )
      .groupBy(ficheActionIndicateurTable.ficheId)
      .as('ficheActionIndicateurs');
  }

  private getFicheActionReferentTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionReferentTable.ficheId,
        referentTagIds: sql<
          number[]
        >`array_remove(array_agg(${ficheActionReferentTable.tagId}), NULL)`.as(
          'referent_tag_ids'
        ),
        referentUserIds: sql<
          string[]
        >`array_remove(array_agg(${ficheActionReferentTable.userId}::text), NULL)`.as(
          'referent_user_ids'
        ),
        referents: sql<
          {
            tagId: number | null;
            userId: string | null;
            nom: string;
            prenom?: string;
            email?: string;
            telephone?: string;
          }[]
        >`array_agg(json_build_object('tagId', ${ficheActionReferentTable.tagId}, 'userId', ${ficheActionReferentTable.userId}, 'nom', COALESCE(${personneTagTable.nom}, ${dcpTable.nom}), 'prenom',  ${dcpTable.prenom}, 'email', ${dcpTable.email}, 'telephone', ${dcpTable.telephone}))`.as(
          'referents'
        ),
      })
      .from(ficheActionReferentTable)
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, ficheActionReferentTable.tagId)
      )
      .leftJoin(dcpTable, eq(dcpTable.userId, ficheActionReferentTable.userId))
      .groupBy(ficheActionReferentTable.ficheId)
      .as('ficheActionReferents');
  }

  private getFicheActionEffetsAttendusQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionEffetAttenduTable.ficheId,
        effetAttenduIds: sql<
          number[]
        >`array_agg(${ficheActionEffetAttenduTable.effetAttenduId})`.as(
          'effet_attendu_ids'
        ),
        effetsAttendus: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionEffetAttenduTable.effetAttenduId}, 'nom', ${effetAttenduTable.nom} ))`.as(
          'effets_attendus'
        ),
      })
      .from(ficheActionEffetAttenduTable)
      .leftJoin(
        effetAttenduTable,
        eq(effetAttenduTable.id, ficheActionEffetAttenduTable.effetAttenduId)
      )
      .groupBy(ficheActionEffetAttenduTable.ficheId)
      .as('ficheActionEffetsAttendus');
  }

  private getFicheActionFinanceurTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionFinanceurTagTable.ficheId,
        financeurTagIds: sql<
          number[]
        >`array_agg(${ficheActionFinanceurTagTable.financeurTagId})`.as(
          'financeur_tag_ids'
        ),
        financeurTags: sql<
          { id: number; nom: string; montantTtc?: number }[]
        >`array_agg(json_build_object('id', ${ficheActionFinanceurTagTable.financeurTagId}, 'nom', ${financeurTagTable.nom}, 'montantTtc', ${ficheActionFinanceurTagTable.montantTtc} ))`.as(
          'financeur_tags'
        ),
      })
      .from(ficheActionFinanceurTagTable)
      .leftJoin(
        financeurTagTable,
        eq(financeurTagTable.id, ficheActionFinanceurTagTable.financeurTagId)
      )
      .groupBy(ficheActionFinanceurTagTable.ficheId)
      .as('ficheActionFinanceurTags');
  }

  private getFicheActionLibreTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionLibreTagTable.ficheId,
        libreTagIds: sql<
          number[]
        >`array_agg(${ficheActionLibreTagTable.libreTagId})`.as(
          'libre_tag_ids'
        ),
        libreTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionLibreTagTable.libreTagId}, 'nom', ${libreTagTable.nom} ))`.as(
          'libre_tags'
        ),
      })
      .from(ficheActionLibreTagTable)
      .leftJoin(
        libreTagTable,
        eq(libreTagTable.id, ficheActionLibreTagTable.libreTagId)
      )
      .groupBy(ficheActionLibreTagTable.ficheId)
      .as('ficheActionLibreTags');
  }

  private getFicheActionStructureTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionStructureTagTable.ficheId,
        structureTagIds: sql<
          number[]
        >`array_agg(${ficheActionStructureTagTable.structureTagId})`.as(
          'structure_tag_ids'
        ),
        structureTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionStructureTagTable.structureTagId}, 'nom', ${structureTagTable.nom} ))`.as(
          'structure_tags'
        ),
      })
      .from(ficheActionStructureTagTable)
      .leftJoin(
        structureTagTable,
        eq(structureTagTable.id, ficheActionStructureTagTable.structureTagId)
      )
      .groupBy(ficheActionStructureTagTable.ficheId)
      .as('ficheActionStructureTags');
  }

  private getFicheActionPartenaireTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionPartenaireTagTable.ficheId,
        partenaireTagIds: sql<
          number[]
        >`array_agg(${ficheActionPartenaireTagTable.partenaireTagId})`.as(
          'partenaire_tag_ids'
        ),
        partenaireTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionPartenaireTagTable.partenaireTagId}, 'nom', ${partenaireTagTable.nom} ))`.as(
          'partenaire_tags'
        ),
      })
      .from(ficheActionPartenaireTagTable)
      .leftJoin(
        partenaireTagTable,
        eq(partenaireTagTable.id, ficheActionPartenaireTagTable.partenaireTagId)
      )
      .groupBy(ficheActionPartenaireTagTable.ficheId)
      .as('ficheActionPartenaireTags');
  }

  private getFicheActionAxesQuery() {
    const planTable = aliasedTable(axeTable, 'plan_table');
    const parentAxeTable = aliasedTable(axeTable, 'parent_axe_table');

    return this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        axeIds: sql<number[]>`array_agg(${ficheActionAxeTable.axeId})`.as(
          'axe_ids'
        ),
        axes: sql<
          {
            id: number;
            nom: string;
            parentId: number | null;
            parentNom: string | null;
          }[]
        >`array_agg(json_build_object('id', ${ficheActionAxeTable.axeId}, 'nom', ${axeTable.nom}, 'parentId', ${parentAxeTable.id}, 'parentNom', ${parentAxeTable.nom}))`.as(
          'axes'
        ),
        planIds: sql<
          number[]
        >`array_agg(COALESCE(${axeTable.plan}, ${axeTable.id}))`.as('plan_ids'),
        plans: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', COALESCE(${axeTable.plan}, ${axeTable.id}), 'nom', COALESCE(${planTable.nom}, ${axeTable.nom})))`.as(
          'plans'
        ),
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, and(eq(axeTable.id, ficheActionAxeTable.axeId)))
      .leftJoin(
        parentAxeTable,
        and(
          eq(axeTable.parent, parentAxeTable.id),
          isNotNull(parentAxeTable.parent)
        )
      )
      .leftJoin(planTable, eq(planTable.id, axeTable.plan))
      .groupBy(ficheActionAxeTable.ficheId)
      .as('ficheActionAxes');
  }

  private getFicheActionServiceTagsQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionServiceTagTable.ficheId,
        serviceTagIds: sql<
          number[]
        >`array_agg(${ficheActionServiceTagTable.serviceTagId})`.as(
          'service_tag_ids'
        ),
        serviceTags: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionServiceTagTable.serviceTagId}, 'nom', ${serviceTagTable.nom} ))`.as(
          'service_tags'
        ),
      })
      .from(ficheActionServiceTagTable)
      .leftJoin(
        serviceTagTable,
        eq(serviceTagTable.id, ficheActionServiceTagTable.serviceTagId)
      )
      .groupBy(ficheActionServiceTagTable.ficheId)
      .as('ficheActionServiceTag');
  }

  private getFicheActionPilotesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionPiloteTable.ficheId,
        piloteTagIds: sql<
          number[]
        >`array_remove(array_agg(${ficheActionPiloteTable.tagId}), NULL)`.as(
          'pilote_tag_ids'
        ),
        piloteUserIds: sql<
          string[]
        >`array_remove(array_agg(${ficheActionPiloteTable.userId}), NULL)`.as(
          'pilote_user_ids'
        ),
        pilotes: sql<
          {
            tagId: number | null;
            userId: string | null;
            nom: string;
            prenom?: string;
            email?: string;
            telephone?: string;
          }[]
        >`array_agg(json_build_object('tagId', ${ficheActionPiloteTable.tagId}, 'userId', ${ficheActionPiloteTable.userId}, 'nom', COALESCE(${personneTagTable.nom}, ${dcpTable.nom}), 'prenom',  ${dcpTable.prenom}, 'email', ${dcpTable.email}, 'telephone', ${dcpTable.telephone}))`.as(
          'pilotes'
        ),
      })
      .from(ficheActionPiloteTable)
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, ficheActionPiloteTable.tagId)
      )
      .leftJoin(dcpTable, eq(dcpTable.userId, ficheActionPiloteTable.userId))
      .groupBy(ficheActionPiloteTable.ficheId)
      .as('ficheActionPilotes');
  }

  private getFicheActionEtapesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionEtapeTable.ficheId,
        etapes: sql<
          { nom: string; realise: boolean; ordre: number }[]
        >`array_agg(json_build_object('nom', ${ficheActionEtapeTable.nom}, 'realise', ${ficheActionEtapeTable.realise}, 'ordre', ${ficheActionEtapeTable.ordre}))`.as(
          'etapes'
        ),
      })
      .from(ficheActionEtapeTable)
      .groupBy(ficheActionEtapeTable.ficheId)
      .as('ficheActionEtapes');
  }

  private getFicheActionNotesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionNoteTable.ficheId,
        notes: sql<
          { note: string; dateNote: string }[]
        >`array_agg(json_build_object('note', ${ficheActionNoteTable.note}, 'dateNote', ${ficheActionNoteTable.dateNote}))`.as(
          'notes'
        ),
      })
      .from(ficheActionNoteTable)
      .groupBy(ficheActionNoteTable.ficheId)
      .as('ficheActionNotes');
  }

  private getFicheActionMesuresQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionActionTable.ficheId,
        mesures: sql<
          { identifiant: string; nom: string; referentiel: string }[]
        >`array_agg(json_build_object('identifiant', ${actionDefinitionTable.identifiant}, 'nom', ${actionDefinitionTable.nom}, 'referentiel', ${actionDefinitionTable.referentiel}))`.as(
          'mesures'
        ),
      })
      .from(ficheActionActionTable)
      .leftJoin(
        actionDefinitionTable,
        eq(actionDefinitionTable.actionId, ficheActionActionTable.actionId)
      )
      .groupBy(ficheActionActionTable.ficheId)
      .as('ficheActionMesures');
  }

  private getFicheActionFichesLieesQuery() {
    return this.databaseService.db
      .select({
        ficheId: ficheActionLienTable.ficheUne,
        fichesLiees: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${ficheActionTable.id}, 'nom', ${ficheActionTable.titre}))`.as(
          'fichesLiees'
        ),
      })
      .from(ficheActionLienTable)
      .leftJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionLienTable.ficheDeux)
      )
      .groupBy(ficheActionLienTable.ficheUne)
      .as('ficheActionFichesLiees');
  }

  private getFicheActionsDocsQuery() {
    return this.databaseService.db
      .select({
        ficheId: annexeTable.ficheId,
        docs: sql<
          { id: number; filename?: string; url?: string }[]
        >`array_agg(json_build_object('id', ${annexeTable.id}, 'filename', ${bibliothequeFichierTable.filename}, 'url', ${annexeTable.url}))`.as(
          'docs'
        ),
      })
      .from(annexeTable)
      .leftJoin(
        bibliothequeFichierTable,
        eq(bibliothequeFichierTable.id, annexeTable.fichierId)
      )
      .groupBy(annexeTable.ficheId)
      .as('ficheActionDocs');
  }

  async getFicheActionById(
    ficheActionId: number,
    addCollectiviteData?: boolean
  ): Promise<
    FicheActionWithRelationsType | FicheActionWithRelationsAndCollectiviteType
  > {
    this.logger.log(`Récupération de la fiche action ${ficheActionId}`);
    const fichesAction: FicheActionWithRelationsAndCollectiviteType[] =
      await this.getFichesAction(null, {
        ficheIds: [ficheActionId],
      });
    if (!fichesAction?.length) {
      throw new NotFoundException(
        `Aucune fiche action trouvée avec l'id ${ficheActionId}`
      );
    }

    const ficheAction = fichesAction[0];
    if (addCollectiviteData) {
      const collectivite = await this.collectiviteService.getCollectivite(
        ficheAction.collectiviteId
      );
      ficheAction.collectivite = collectivite.collectivite as Collectivite;
    }

    return ficheAction;
  }

  async getFichesAction(
    collectiviteId: number | null,
    filter: GetFichesActionFilterRequestType
  ): Promise<FicheActionWithRelationsType[]> {
    this.logger.log(
      `Récupération des fiches action pour la collectivité ${collectiviteId}: filtre ${JSON.stringify(
        filter
      )}`
    );

    const ficheActionPartenaireTags = this.getFicheActionPartenaireTagsQuery();
    const ficheActionThematiques = this.getFicheActionThematiquesQuery();
    const ficheActionSousThematiques =
      this.getFicheActionSousThematiquesQuery();
    const ficheActionFinanceurTags = this.getFicheActionFinanceurTagsQuery();
    const ficheActionIndicateurs = this.getFicheActionIndicateursQuery();
    const ficheActionReferent = this.getFicheActionReferentTagsQuery();
    const ficheActionEffetsAttendus = this.getFicheActionEffetsAttendusQuery();
    const ficheActionStructureTags = this.getFicheActionStructureTagsQuery();
    const ficheActionLibreTags = this.getFicheActionLibreTagsQuery();
    const ficheActionPilotes = this.getFicheActionPilotesQuery();
    const ficheActionServiceTags = this.getFicheActionServiceTagsQuery();
    const ficheActionAxes = this.getFicheActionAxesQuery();
    const ficheActionEtapes = this.getFicheActionEtapesQuery();
    const ficheActionNotes = this.getFicheActionNotesQuery();
    const ficheActionMesures = this.getFicheActionMesuresQuery();
    const ficheActionFichesLiees = this.getFicheActionFichesLieesQuery();
    const ficheActionDocs = this.getFicheActionsDocsQuery();

    const conditions = this.getConditions(collectiviteId, filter);
    const dcpModifiedBy = aliasedTable(dcpTable, 'dcpModifiedBy');

    const fichesActionQuery = this.databaseService.db
      .select({
        ...getTableColumns(ficheActionTable),
        createdByName: sql<string>`(${dcpTable.prenom} || ' ' || ${dcpTable.nom})::text`,
        modifiedByName: sql<string>`(${dcpModifiedBy.prenom} || ' ' || ${dcpModifiedBy.nom})::text`,
        tempsDeMiseEnOeuvreNom: tempsDeMiseEnOeuvreTable.nom,
        partenaires: ficheActionPartenaireTags.partenaireTags,
        pilotes: ficheActionPilotes.pilotes,
        tags: ficheActionLibreTags.libreTags,
        thematiques: ficheActionThematiques.thematiques,
        indicateurs: ficheActionIndicateurs.indicateurs,
        sousThematiques: ficheActionSousThematiques.sousThematiques,
        structures: ficheActionStructureTags.structureTags,
        financeurs: ficheActionFinanceurTags.financeurTags,
        effetsAttendus: ficheActionEffetsAttendus.effetsAttendus,
        referents: ficheActionReferent.referents,
        services: ficheActionServiceTags.serviceTags,
        axes: ficheActionAxes.axes,
        plans: ficheActionAxes.plans,
        etapes: ficheActionEtapes.etapes,
        notes: ficheActionNotes.notes,
        mesures: ficheActionMesures.mesures,
        fichesLiees: ficheActionFichesLiees.fichesLiees,
        docs: ficheActionDocs.docs,
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPartenaireTags,
        eq(ficheActionPartenaireTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionReferent,
        eq(ficheActionReferent.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionIndicateurs,
        eq(ficheActionIndicateurs.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionEffetsAttendus,
        eq(ficheActionEffetsAttendus.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionStructureTags,
        eq(ficheActionStructureTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionFinanceurTags,
        eq(ficheActionFinanceurTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionLibreTags,
        eq(ficheActionLibreTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionThematiques,
        eq(ficheActionThematiques.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionSousThematiques,
        eq(ficheActionSousThematiques.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionPilotes,
        eq(ficheActionPilotes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionServiceTags,
        eq(ficheActionServiceTags.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionAxes,
        eq(ficheActionAxes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionEtapes,
        eq(ficheActionEtapes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionNotes,
        eq(ficheActionNotes.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionMesures,
        eq(ficheActionMesures.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionFichesLiees,
        eq(ficheActionFichesLiees.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionDocs,
        eq(ficheActionDocs.ficheId, ficheActionTable.id)
      )
      .leftJoin(dcpTable, eq(dcpTable.userId, ficheActionTable.createdBy))
      .leftJoin(
        dcpModifiedBy,
        eq(dcpModifiedBy.userId, ficheActionTable.modifiedBy)
      )
      .leftJoin(
        tempsDeMiseEnOeuvreTable,
        eq(tempsDeMiseEnOeuvreTable.id, ficheActionTable.tempsDeMiseEnOeuvre)
      )
      .where(and(...conditions));

    return await fichesActionQuery;
  }

  private addArrayOverlapsConditionForStringArray(
    conditions: (SQLWrapper | SQL)[],
    column: SQL,
    filter?: string[]
  ) {
    if (filter?.length) {
      // Vraiment étrange, probable bug de drizzle, on le peut pas lui donner le tableau directement
      const sqlStringArray = `{${filter.map((val) => `"${val}"`).join(',')}}`;
      conditions.push(arrayOverlaps(column, sql`${sqlStringArray}`));
    }
  }

  private addArrayOverlapsConditionForIntArray(
    conditions: (SQLWrapper | SQL)[],
    column: SQL,
    filter?: number[]
  ) {
    if (filter?.length) {
      // Vraiment étrange, probable bug de drizzle, on le peut pas lui donner le tableau directement
      const sqlNumberArray = `{${filter.join(',')}}`;
      conditions.push(arrayOverlaps(column, sql`${sqlNumberArray}`));
    }
  }

  private getTimeColumn(typePeriode?: TypePeriodeEnumType) {
    switch (typePeriode) {
      case 'creation':
        return ficheActionTable.createdAt;
      case 'modification':
        return ficheActionTable.modifiedAt;
      case 'debut':
        return ficheActionTable.dateDebut;
      case 'fin':
        return ficheActionTable.dateFin;
      default:
        return ficheActionTable.modifiedAt;
    }
  }

  private getConditions(
    collectiviteId: number | null,
    filter: GetFichesActionFilterRequestType
  ): (SQLWrapper | SQL)[] {
    const conditions: (SQLWrapper | SQL)[] = [];

    if (collectiviteId) {
      conditions.push(eq(ficheActionTable.collectiviteId, collectiviteId));
    }

    if (filter.ficheIds?.length) {
      conditions.push(inArray(ficheActionTable.id, filter.ficheIds));
    }

    if (filter.noStatut) {
      conditions.push(isNull(ficheActionTable.statut));
    }
    if (filter.statuts?.length) {
      conditions.push(inArray(ficheActionTable.statut, filter.statuts));
    }
    if (filter.noPriorite) {
      conditions.push(isNull(ficheActionTable.priorite));
    }
    if (filter.priorites?.length) {
      conditions.push(inArray(ficheActionTable.priorite, filter.priorites));
    }
    if (filter.budgetPrevisionnel) {
      conditions.push(isNotNull(ficheActionTable.budgetPrevisionnel));
    }
    if (filter.ameliorationContinue) {
      conditions.push(eq(ficheActionTable.ameliorationContinue, true));
    }
    if (!isNil(filter.restreint)) {
      conditions.push(eq(ficheActionTable.restreint, filter.restreint));
    }
    if (filter.hasIndicateurLies) {
      conditions.push(isNotNull(sql`indicateur_ids`));
    }

    if (filter.cibles?.length) {
      conditions.push(arrayOverlaps(ficheActionTable.cibles, filter.cibles));
    }
    if (filter.modifiedSince) {
      const modifiedSinceDate = getModifiedSinceDate(filter.modifiedSince);
      conditions.push(gte(ficheActionTable.modifiedAt, modifiedSinceDate));
    }
    if (filter.modifiedAfter) {
      conditions.push(gte(ficheActionTable.modifiedAt, filter.modifiedAfter));
    }

    if (filter.debutPeriode) {
      conditions.push(
        gte(this.getTimeColumn(filter.typePeriode), filter.debutPeriode)
      );
    }

    if (filter.finPeriode) {
      conditions.push(
        lte(this.getTimeColumn(filter.typePeriode), filter.finPeriode)
      );
    }

    if (filter.partenaireIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`partenaire_tag_ids`,
        filter.partenaireIds
      );
    }
    if (filter.financeurIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`financeur_tag_ids`,
        filter.financeurIds
      );
    }
    if (filter.servicePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`service_tag_ids`,
        filter.servicePiloteIds
      );
    }
    if (filter.structurePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`structure_tag_ids`,
        filter.structurePiloteIds
      );
    }
    if (filter.libreTagsIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`libre_tag_ids`,
        filter.libreTagsIds
      );
    }
    if (filter.planActionIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`plan_ids`,
        filter.planActionIds
      );
    }
    if (filter.thematiqueIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`thematique_ids`,
        filter.thematiqueIds
      );
    }
    if (filter.sousThematiqueIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`sous_thematique_ids`,
        filter.sousThematiqueIds
      );
    }
    if (filter.noPilote) {
      const condition = and(
        isNull(sql`pilote_user_ids`),
        isNull(sql`pilote_tag_ids`)
      );
      conditions.push(condition!);
    }
    if (filter.noServicePilote) {
      conditions.push(isNull(sql`service_tag_ids`));
    }

    const piloteConditions: (SQLWrapper | SQL)[] = [];
    if (filter.utilisateurPiloteIds?.length) {
      this.addArrayOverlapsConditionForStringArray(
        piloteConditions,
        sql`pilote_user_ids`,
        filter.utilisateurPiloteIds
      );
    }
    if (filter.personnePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        piloteConditions,
        sql`pilote_tag_ids`,
        filter.personnePiloteIds
      );
    }
    if (piloteConditions.length) {
      if (piloteConditions.length === 1) {
        conditions.push(piloteConditions[0]);
      } else {
        conditions.push(or(...piloteConditions)!);
      }
    }

    const referentConditions: (SQLWrapper | SQL)[] = [];
    if (filter.utilisateurReferentIds?.length) {
      this.addArrayOverlapsConditionForStringArray(
        referentConditions,
        sql`referent_user_ids`,
        filter.utilisateurReferentIds
      );
    }
    if (filter.personneReferenteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        referentConditions,
        sql`referent_tag_ids`,
        filter.personneReferenteIds
      );
    }
    if (referentConditions.length) {
      if (referentConditions.length === 1) {
        conditions.push(referentConditions[0]);
      } else {
        conditions.push(or(...referentConditions)!);
      }
    }

    return conditions;
  }
}
