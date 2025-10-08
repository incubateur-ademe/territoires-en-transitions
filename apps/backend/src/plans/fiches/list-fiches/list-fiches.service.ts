import { annexeTable } from '@/backend/collectivites/documents/models/annexe.table';
import { bibliothequeFichierTable } from '@/backend/collectivites/documents/models/bibliotheque-fichier.table';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import {
  Collectivite,
  collectiviteTable,
} from '@/backend/collectivites/shared/models/collectivite.table';
import { PersonneTagOrUserWithContacts } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { financeurTagTable } from '@/backend/collectivites/tags/financeur-tag.table';
import { libreTagTable } from '@/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@/backend/collectivites/tags/structure-tag.table';
import {
  Tag,
  TagWithOptionalCollectivite,
} from '@/backend/collectivites/tags/tag.table-base';
import { indicateurDefinitionTable } from '@/backend/indicateurs/shared/models/indicateur-definition.table';
import { ficheActionBudgetTable } from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { ficheActionNoteTable } from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import FicheActionPermissionsService from '@/backend/plans/fiches/fiche-action-permissions.service';
import {
  ListFichesSortValue,
  QueryOptionsSchema,
} from '@/backend/plans/fiches/list-fiches/list-fiches.request';
import { ficheActionSharingTable } from '@/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import {
  ListFichesRequestFilters,
  TypePeriodeEnum,
} from '@/backend/plans/fiches/shared/filters/filters.request';
import { axeTable } from '@/backend/plans/fiches/shared/models/axe.table';
import { ficheActionEffetAttenduTable } from '@/backend/plans/fiches/shared/models/fiche-action-effet-attendu.table';
import {
  ficheActionFinanceurTagTable,
  Financeur,
} from '@/backend/plans/fiches/shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionLibreTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from '@/backend/plans/fiches/shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-partenaire-tag.table';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '@/backend/plans/fiches/shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '@/backend/plans/fiches/shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { actionImpactActionTable } from '@/backend/plans/paniers/models/action-impact-action.table';
import { actionDefinitionTable } from '@/backend/referentiels/models/action-definition.table';
import {
  EffetAttendu,
  effetAttenduTable,
} from '@/backend/shared/effet-attendu/effet-attendu.table';
import {
  TempsDeMiseEnOeuvre,
  tempsDeMiseEnOeuvreTable,
} from '@/backend/shared/models/temps-de-mise-en-oeuvre.table';
import {
  SousThematique,
  sousThematiqueTable,
} from '@/backend/shared/thematiques/sous-thematique.table';
import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import { AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils';
import { getModifiedSinceDate } from '@/backend/utils/modified-since.enum';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  aliasedTable,
  and,
  arrayOverlaps,
  Column,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  notExists,
  or,
  sql,
  SQL,
  SQLWrapper,
  Table,
} from 'drizzle-orm';
import { PgColumn, TableConfig } from 'drizzle-orm/pg-core';
import { isNil } from 'es-toolkit';
import { ficheActionEtapeTable } from '../fiche-action-etape/fiche-action-etape.table';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import {
  FicheWithRelations,
  FicheWithRelationsAndCollectivite,
} from './fiche-action-with-relations.dto';

const sortColumn: Record<ListFichesSortValue, PgColumn> = {
  modified_at: ficheActionTable.modifiedAt,
  created_at: ficheActionTable.createdAt,
  dateDebut: ficheActionTable.dateDebut,
  titre: ficheActionTable.titre,
};

@Injectable()
export default class ListFichesService {
  private readonly logger = new Logger(ListFichesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectiviteService: CollectivitesService,
    private readonly fichePermissionService: FicheActionPermissionsService
  ) {}

  private getFicheActionSousThematiquesQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionSousThematiqueTable.ficheId,
        sousThematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionSousThematiqueTable.thematiqueId})`.as(
          'sous_thematique_ids'
        ),
        sousThematiques: sql<
          SousThematique[]
        >`array_agg(json_build_object('id', ${ficheActionSousThematiqueTable.thematiqueId}, 'nom', ${sousThematiqueTable.nom}, 'thematiqueId', ${sousThematiqueTable.thematiqueId} ))`.as(
          'sous_thematiques'
        ),
      })
      .from(ficheActionSousThematiqueTable)
      .leftJoin(
        sousThematiqueTable,
        eq(sousThematiqueTable.id, ficheActionSousThematiqueTable.thematiqueId)
      );

    query.where(inArray(ficheActionSousThematiqueTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionSousThematiqueTable.ficheId)
      .as('ficheActionSousThematiques');
  }

  private getFicheActionThematiquesQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionThematiqueTable.ficheId,
        thematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionThematiqueTable.thematiqueId})`.as(
          'thematique_ids'
        ),
        thematiques: sql<
          TagWithOptionalCollectivite[]
        >`array_agg(json_build_object('id', ${ficheActionThematiqueTable.thematiqueId}, 'nom', ${thematiqueTable.nom} ))`.as(
          'thematiques'
        ),
      })
      .from(ficheActionThematiqueTable)
      .leftJoin(
        thematiqueTable,
        eq(thematiqueTable.id, ficheActionThematiqueTable.thematiqueId)
      );

    query.where(inArray(ficheActionThematiqueTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionThematiqueTable.ficheId)
      .as('ficheActionThematiques');
  }

  private getFicheActionIndicateursQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionIndicateurTable.ficheId,
        indicateurIds: sql<
          number[]
        >`array_agg(${ficheActionIndicateurTable.indicateurId})`.as(
          'indicateur_ids'
        ),
        indicateurs: sql<
          {
            id: number;
            nom: string;
            titre: string;
            identifiant: string;
            unite: string;
          }[]
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
      );

    query.where(inArray(ficheActionIndicateurTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionIndicateurTable.ficheId)
      .as('ficheActionIndicateurs');
  }

  private getFicheActionReferentTagsQuery(ficheIds: number[]) {
    const query = this.databaseService.db
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
          PersonneTagOrUserWithContacts[]
        >`array_agg(json_build_object('tagId', ${ficheActionReferentTable.tagId}, 'userId', ${ficheActionReferentTable.userId}, 'nom', COALESCE(${personneTagTable.nom}, ${dcpTable.prenom} || ' ' || ${dcpTable.nom}), 'email', ${dcpTable.email}, 'telephone', ${dcpTable.telephone}))`.as(
          'referents'
        ),
      })
      .from(ficheActionReferentTable)
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, ficheActionReferentTable.tagId)
      )
      .leftJoin(dcpTable, eq(dcpTable.userId, ficheActionReferentTable.userId));

    query.where(inArray(ficheActionReferentTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionReferentTable.ficheId)
      .as('ficheActionReferents');
  }

  private getFicheActionEffetsAttendusQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionEffetAttenduTable.ficheId,
        effetAttenduIds: sql<
          number[]
        >`array_agg(${ficheActionEffetAttenduTable.effetAttenduId})`.as(
          'effet_attendu_ids'
        ),
        effetsAttendus: sql<
          EffetAttendu[]
        >`array_agg(json_build_object('id', ${ficheActionEffetAttenduTable.effetAttenduId}, 'nom', ${effetAttenduTable.nom}, 'notice', ${effetAttenduTable.notice} ))`.as(
          'effets_attendus'
        ),
      })
      .from(ficheActionEffetAttenduTable)
      .leftJoin(
        effetAttenduTable,
        eq(effetAttenduTable.id, ficheActionEffetAttenduTable.effetAttenduId)
      );

    query.where(inArray(ficheActionEffetAttenduTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionEffetAttenduTable.ficheId)
      .as('ficheActionEffetsAttendus');
  }

  private getFicheActionFinanceurTagsQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionFinanceurTagTable.ficheId,
        financeurTagIds: sql<
          number[]
        >`array_agg(${ficheActionFinanceurTagTable.financeurTagId})`.as(
          'financeur_tag_ids'
        ),
        financeurTags: sql<Financeur[]>`array_agg(json_build_object(
          'financeurTagId', ${ficheActionFinanceurTagTable.financeurTagId},
          'ficheId', ${ficheActionFinanceurTagTable.ficheId},
          'montantTtc', ${ficheActionFinanceurTagTable.montantTtc},
          'financeurTag', json_build_object(
            'id', ${financeurTagTable.id},
            'nom', ${financeurTagTable.nom}
          )
          )
          )`.as('financeur_tags'),
      })
      .from(ficheActionFinanceurTagTable)
      .leftJoin(
        financeurTagTable,
        eq(financeurTagTable.id, ficheActionFinanceurTagTable.financeurTagId)
      );

    query.where(inArray(ficheActionFinanceurTagTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionFinanceurTagTable.ficheId)
      .as('ficheActionFinanceurTags');
  }

  private getFicheActionLibreTagsQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionLibreTagTable.ficheId,
        libreTagIds: sql<
          number[]
        >`array_agg(${ficheActionLibreTagTable.libreTagId})`.as(
          'libre_tag_ids'
        ),
        libreTags: sql<
          TagWithOptionalCollectivite[]
        >`array_agg(json_build_object('id', ${ficheActionLibreTagTable.libreTagId}, 'nom', ${libreTagTable.nom} ))`.as(
          'libre_tags'
        ),
      })
      .from(ficheActionLibreTagTable)
      .leftJoin(
        libreTagTable,
        eq(libreTagTable.id, ficheActionLibreTagTable.libreTagId)
      );

    query.where(inArray(ficheActionLibreTagTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionLibreTagTable.ficheId)
      .as('ficheActionLibreTags');
  }

  private getFicheActionStructureTagsQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionStructureTagTable.ficheId,
        structureTagIds: sql<
          number[]
        >`array_agg(${ficheActionStructureTagTable.structureTagId})`.as(
          'structure_tag_ids'
        ),
        structureTags: sql<
          TagWithOptionalCollectivite[]
        >`array_agg(json_build_object('id', ${ficheActionStructureTagTable.structureTagId}, 'nom', ${structureTagTable.nom} ))`.as(
          'structure_tags'
        ),
      })
      .from(ficheActionStructureTagTable)
      .leftJoin(
        structureTagTable,
        eq(structureTagTable.id, ficheActionStructureTagTable.structureTagId)
      );

    query.where(inArray(ficheActionStructureTagTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionStructureTagTable.ficheId)
      .as('ficheActionStructureTags');
  }

  private getFicheActionPartenaireTagsQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionPartenaireTagTable.ficheId,
        partenaireTagIds: sql<
          number[]
        >`array_agg(${ficheActionPartenaireTagTable.partenaireTagId})`.as(
          'partenaire_tag_ids'
        ),
        partenaireTags: sql<TagWithOptionalCollectivite[]>`
            array_agg(
              json_build_object(
                'id', ${ficheActionPartenaireTagTable.partenaireTagId},
                'nom', ${partenaireTagTable.nom}
              )
            )
          `.as('partenaire_tags'),
      })
      .from(ficheActionPartenaireTagTable)
      .leftJoin(
        partenaireTagTable,
        eq(partenaireTagTable.id, ficheActionPartenaireTagTable.partenaireTagId)
      );

    query.where(inArray(ficheActionPartenaireTagTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionPartenaireTagTable.ficheId)
      .as('ficheActionPartenaireTags');
  }

  private getFicheActionAxesQuery(ficheIds: number[]) {
    const planTable = aliasedTable(axeTable, 'plan_table');
    const parentAxeTable = aliasedTable(axeTable, 'parent_axe_table');

    const query = this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        axeIds: sql<number[]>`array_agg(${ficheActionAxeTable.axeId})`.as(
          'axe_ids'
        ),
        axesCollectiviteIds: sql<
          number[]
        >`array_agg(distinct ${axeTable.collectiviteId})`.as(
          'axes_collectivite_ids'
        ),
        axes: sql<
          {
            id: number;
            nom: string;
            collectiviteId: number;
            parentId: number | null;
            planId: number | null;
          }[]
        >`array_agg(json_build_object('id', ${ficheActionAxeTable.axeId}, 'nom', ${axeTable.nom}, 'collectiviteId', ${axeTable.collectiviteId}, 'parentId', ${parentAxeTable.id}, 'planId', ${axeTable.plan}))`.as(
          'axes'
        ),
        planIds: sql<
          number[]
        >`array_agg(COALESCE(${axeTable.plan}, ${axeTable.id}))`.as('plan_ids'),
        plans: sql<
          Tag[]
        >`array_agg(json_build_object('id', COALESCE(${axeTable.plan}, ${axeTable.id}), 'nom', COALESCE(${planTable.nom}, ${axeTable.nom}),  'collectiviteId', ${axeTable.collectiviteId}))`.as(
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
      .leftJoin(planTable, eq(planTable.id, axeTable.plan));

    query.where(inArray(ficheActionAxeTable.ficheId, ficheIds));

    return query.groupBy(ficheActionAxeTable.ficheId).as('ficheActionAxes');
  }

  private getFicheActionServicesQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionServiceTagTable.ficheId,
        serviceTagIds: sql<
          number[]
        >`array_agg(${ficheActionServiceTagTable.serviceTagId})`.as(
          'service_tag_ids'
        ),
        services: sql<
          Tag[]
        >`array_agg(json_build_object('id', ${serviceTagTable.id}, 'nom', ${serviceTagTable.nom}, 'collectiviteId', ${serviceTagTable.collectiviteId}))`.as(
          'services'
        ),
      })
      .from(ficheActionServiceTagTable)
      .leftJoin(
        serviceTagTable,
        eq(serviceTagTable.id, ficheActionServiceTagTable.serviceTagId)
      );

    query.where(inArray(ficheActionServiceTagTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionServiceTagTable.ficheId)
      .as('ficheActionServiceTag');
  }

  private getFicheActionPilotesQuery(ficheIds: number[]) {
    const query = this.databaseService.db
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
        pilotes: sql<PersonneTagOrUserWithContacts[]>`array_agg(
            json_build_object(
              'tagId', ${ficheActionPiloteTable.tagId},
              'userId', ${ficheActionPiloteTable.userId},
              'nom',
              CASE
                WHEN ${ficheActionPiloteTable.userId} IS NOT NULL THEN CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})
                ELSE ${personneTagTable.nom}
              END,
              'email', ${dcpTable.email}, 'telephone', ${dcpTable.telephone}
            )
          )`.as('pilotes'),
      })
      .from(ficheActionPiloteTable)
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, ficheActionPiloteTable.tagId)
      )
      .leftJoin(dcpTable, eq(dcpTable.userId, ficheActionPiloteTable.userId));

    query.where(inArray(ficheActionPiloteTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionPiloteTable.ficheId)
      .as('ficheActionPilotes');
  }

  private getFicheActionEtapesQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionEtapeTable.ficheId,
        etapes: sql<
          { nom: string; realise: boolean; ordre: number }[]
        >`array_agg(json_build_object('nom', ${ficheActionEtapeTable.nom}, 'realise', ${ficheActionEtapeTable.realise}, 'ordre', ${ficheActionEtapeTable.ordre}))`.as(
          'etapes'
        ),
      })
      .from(ficheActionEtapeTable);

    query.where(inArray(ficheActionEtapeTable.ficheId, ficheIds));

    return query.groupBy(ficheActionEtapeTable.ficheId).as('ficheActionEtapes');
  }

  private getFicheActionNotesQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionNoteTable.ficheId,
        notes: sql<
          { note: string; dateNote: string }[]
        >`array_agg(json_build_object('note', ${ficheActionNoteTable.note}, 'dateNote', ${ficheActionNoteTable.dateNote}))`.as(
          'notes'
        ),
        anneesNotes: sql<
          string[]
        >`array_agg(${ficheActionNoteTable.dateNote})`.as('annees_notes'),
      })
      .from(ficheActionNoteTable);

    query.where(inArray(ficheActionNoteTable.ficheId, ficheIds));

    return query.groupBy(ficheActionNoteTable.ficheId).as('ficheActionNotes');
  }

  private getFicheActionMesuresQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionActionTable.ficheId,
        mesureId: sql<
          string[]
        >`array_agg(${ficheActionActionTable.actionId})`.as('mesure_ids'),
        mesures: sql<
          {
            id: string;
            identifiant: string;
            nom: string;
            referentiel: string;
          }[]
        >`array_agg(json_build_object('id', ${ficheActionActionTable.actionId}, 'identifiant', ${actionDefinitionTable.identifiant}, 'nom', ${actionDefinitionTable.nom}, 'referentiel', ${actionDefinitionTable.referentiel}))`.as(
          'mesures'
        ),
      })
      .from(ficheActionActionTable)
      .leftJoin(
        actionDefinitionTable,
        eq(actionDefinitionTable.actionId, ficheActionActionTable.actionId)
      );

    query.where(inArray(ficheActionActionTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionActionTable.ficheId)
      .as('ficheActionMesures');
  }

  private getFicheActionSharingsQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionSharingTable.ficheId,
        sharedWithCollectiviteIds: sql<
          number[]
        >`array_agg(${ficheActionSharingTable.collectiviteId})`.as(
          'shared_with_collectivite_ids'
        ),
        sharedWithCollectivites: sql<
          {
            id: number;
            nom: string;
          }[]
        >`array_agg(json_build_object('id', ${ficheActionSharingTable.collectiviteId}, 'nom', ${collectiviteTable.nom}))`.as(
          'shared_with_collectivites'
        ),
      })
      .from(ficheActionSharingTable)
      .leftJoin(
        collectiviteTable,
        eq(ficheActionSharingTable.collectiviteId, collectiviteTable.id)
      );

    query.where(inArray(ficheActionSharingTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionSharingTable.ficheId)
      .as('ficheActionSharings');
  }

  private getFicheActionFichesLieesQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionLienTable.ficheUne,
        fichesLiees: sql<
          TagWithOptionalCollectivite[]
        >`array_agg(json_build_object('id', ${ficheActionTable.id}, 'nom', ${ficheActionTable.titre}))`.as(
          'fichesLiees'
        ),
      })
      .from(ficheActionLienTable)
      .leftJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionLienTable.ficheDeux)
      );

    query.where(inArray(ficheActionLienTable.ficheUne, ficheIds));

    return query
      .groupBy(ficheActionLienTable.ficheUne)
      .as('ficheActionFichesLiees');
  }

  private getFicheActionsDocsQuery(ficheIds: number[]) {
    const query = this.databaseService.db
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
      );

    query.where(inArray(annexeTable.ficheId, ficheIds));

    return query.groupBy(annexeTable.ficheId).as('ficheActionDocs');
  }

  private getFicheActionBudgetsQuery(ficheIds: number[]) {
    const query = this.databaseService.db
      .select({
        ficheId: ficheActionBudgetTable.ficheId,
        budgets: sql<
          {
            id: number;
            ficheId: number;
            type: string;
            unite: string;
            annee?: number | null;
            budgetPrevisionnel?: string | null;
            budgetReel?: string | null;
            estEtale?: boolean;
          }[]
        >`array_agg
        (json_build_object(
          'id', ${ficheActionBudgetTable.id},
          'type', ${ficheActionBudgetTable.type},
          'unite', ${ficheActionBudgetTable.unite},
          'annee', ${ficheActionBudgetTable.annee},
          'budgetPrevisionnel', ${ficheActionBudgetTable.budgetPrevisionnel},
          'budgetReel', ${ficheActionBudgetTable.budgetReel},
          'estEtale', ${ficheActionBudgetTable.estEtale}))`.as('budgets'),
      })
      .from(ficheActionBudgetTable);

    query.where(inArray(ficheActionBudgetTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionBudgetTable.ficheId)
      .as('ficheActionBudgets');
  }

  async getFicheById(
    ficheId: number,
    addCollectiviteData?: boolean,
    user?: AuthUser
  ): Promise<FicheWithRelations | FicheWithRelationsAndCollectivite> {
    this.logger.log(`Récupération de la fiche action ${ficheId}`);

    const { data: fichesAction } = await this.listFichesQuery(null, {
      ficheIds: [ficheId],
    });

    if (!fichesAction?.length) {
      throw new NotFoundException(
        `Aucune fiche action trouvée avec l'id ${ficheId}`
      );
    }

    const ficheAction = fichesAction[0];
    if (user) {
      await this.fichePermissionService.canReadFicheObject(ficheAction, user);
    }

    if (addCollectiviteData) {
      const collectivite = await this.collectiviteService.getCollectivite(
        ficheAction.collectiviteId
      );
      (ficheAction as FicheWithRelationsAndCollectivite).collectivite =
        collectivite.collectivite as Collectivite;
    }

    return ficheAction;
  }

  async countPiloteFiches(collectiviteId: number, user: AuthUser) {
    if (!user.id) {
      throw new BadRequestException(
        `Seulement supporté pour les utilisateurs authentifiés`
      );
    }

    const query = this.databaseService.db
      .select({
        count: count(),
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPiloteTable,
        eq(ficheActionPiloteTable.ficheId, ficheActionTable.id)
      )
      .where(
        and(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          eq(ficheActionPiloteTable.userId, user.id)
        )
      );

    const queryResult = await query;

    return queryResult[0]?.count ?? 0;
  }

  async countPiloteFichesIndicateurs(collectiviteId: number, user: AuthUser) {
    if (!user.id) {
      throw new BadRequestException(
        `Seulement supporté pour les utilisateurs authentifiés`
      );
    }

    const query = this.databaseService.db
      .select({
        count:
          sql<number>`count(distinct ${ficheActionIndicateurTable.indicateurId})`.mapWith(
            Number
          ),
      })
      .from(ficheActionTable)
      .leftJoin(
        ficheActionPiloteTable,
        eq(ficheActionPiloteTable.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionIndicateurTable,
        eq(ficheActionIndicateurTable.ficheId, ficheActionTable.id)
      )
      .where(
        and(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          eq(ficheActionPiloteTable.userId, user.id),
          isNotNull(ficheActionIndicateurTable.indicateurId)
        )
      );

    const queryResult = await query;

    return queryResult[0]?.count ?? 0;
  }

  private getFicheIdsQuery(
    collectiviteId: number | null,
    filters?: ListFichesRequestFilters,
    queryOptions?: QueryOptionsSchema
  ) {
    if (filters && Object.keys(filters).length > 0) {
      const filterSummary = this.formatLogs(filters);
      this.logger.log(
        `Récupération des fiches action pour la collectivité ${collectiviteId} ${
          filterSummary ? `(filtre(s) appliqué(s): ${filterSummary})` : ''
        }`
      );
    } else {
      this.logger.log(
        `Récupération des toutes les fiches action pour la collectivité ${collectiviteId}`
      );
    }

    const conditions: (SQLWrapper | SQL | undefined)[] = this.getConditions(
      collectiviteId,
      filters
    );

    const ficheIdsQuery = this.databaseService.db
      .select({
        id: ficheActionTable.id,
        count: sql<number>`(count(*) over())::int`,
      })
      .from(ficheActionTable);

    ficheIdsQuery.where(and(...conditions));

    if (queryOptions?.sort) {
      queryOptions.sort.forEach((sort) => {
        const column = sortColumn[sort.field];

        const columnWithCollation =
          column === ficheActionTable.titre
            ? sql`${column} collate numeric_with_case_and_accent_insensitive`
            : column;

        ficheIdsQuery.orderBy(
          sort.direction === 'asc'
            ? columnWithCollation
            : desc(columnWithCollation)
        );
      });
    }

    if (queryOptions?.limit === 'all') {
      return ficheIdsQuery;
    }
    if (queryOptions?.page && queryOptions?.limit) {
      ficheIdsQuery
        .limit(queryOptions.limit)
        .offset((queryOptions.page - 1) * queryOptions.limit);
    }

    return ficheIdsQuery;
  }

  private async listFichesQuery(
    collectiviteId: number | null,
    filters?: ListFichesRequestFilters,
    queryOptions?: QueryOptionsSchema
  ): Promise<{
    data: FicheWithRelations[];
    count: number;
  }> {
    const ficheIdsQuery = this.getFicheIdsQuery(
      collectiviteId,
      filters,
      queryOptions
    );
    const ficheIdQueryResult = await ficheIdsQuery;
    const ficheIds = ficheIdQueryResult.map((fiche) => fiche.id);
    const count = ficheIdQueryResult[0]?.count ?? 0;

    const ficheActionPartenaireTags =
      this.getFicheActionPartenaireTagsQuery(ficheIds);
    const ficheActionThematiques =
      this.getFicheActionThematiquesQuery(ficheIds);
    const ficheActionSousThematiques =
      this.getFicheActionSousThematiquesQuery(ficheIds);
    const ficheActionFinanceurTags =
      this.getFicheActionFinanceurTagsQuery(ficheIds);
    const ficheActionIndicateurs =
      this.getFicheActionIndicateursQuery(ficheIds);
    const ficheActionReferent = this.getFicheActionReferentTagsQuery(ficheIds);
    const ficheActionEffetsAttendus =
      this.getFicheActionEffetsAttendusQuery(ficheIds);
    const ficheActionStructureTags =
      this.getFicheActionStructureTagsQuery(ficheIds);
    const ficheActionLibreTags = this.getFicheActionLibreTagsQuery(ficheIds);
    const ficheActionPilotes = this.getFicheActionPilotesQuery(ficheIds);
    const ficheActionServices = this.getFicheActionServicesQuery(ficheIds);
    const ficheActionAxes = this.getFicheActionAxesQuery(ficheIds);
    const ficheActionEtapes = this.getFicheActionEtapesQuery(ficheIds);
    const ficheActionNotes = this.getFicheActionNotesQuery(ficheIds);
    const ficheActionMesures = this.getFicheActionMesuresQuery(ficheIds);
    const ficheActionFichesLiees =
      this.getFicheActionFichesLieesQuery(ficheIds);
    const ficheActionDocs = this.getFicheActionsDocsQuery(ficheIds);
    const ficheActionSharings = this.getFicheActionSharingsQuery(ficheIds);
    const ficheActionBudgets = this.getFicheActionBudgetsQuery(ficheIds);

    const dcpModifiedBy = aliasedTable(dcpTable, 'dcpModifiedBy');

    const query = this.databaseService.db
      .select({
        ...getTableColumns(ficheActionTable),
        collectiviteNom: collectiviteTable.nom,
        createdBy: sql<{
          id: string;
          prenom: string;
          nom: string;
        } | null>`CASE WHEN ${ficheActionTable.createdBy} IS NULL THEN NULL ELSE json_build_object('id', ${ficheActionTable.createdBy}, 'prenom', ${dcpTable.prenom}, 'nom', ${dcpTable.nom}) END`,
        modifiedBy: sql<{
          id: string;
          prenom: string;
          nom: string;
        } | null>`CASE WHEN ${dcpModifiedBy.userId} IS NULL THEN NULL ELSE json_build_object('id', ${dcpModifiedBy.userId}, 'prenom', ${dcpModifiedBy.prenom}, 'nom', ${dcpModifiedBy.nom}) END`,
        tempsDeMiseEnOeuvre: sql<TempsDeMiseEnOeuvre>`CASE WHEN ${tempsDeMiseEnOeuvreTable.id} IS NULL THEN NULL ELSE json_build_object('id', ${tempsDeMiseEnOeuvreTable.id}, 'nom', ${tempsDeMiseEnOeuvreTable.nom}) END`,
        partenaires: sql<
          TagWithOptionalCollectivite[]
        >`COALESCE(${ficheActionPartenaireTags.partenaireTags}, ARRAY[]::json[])`,
        pilotes: ficheActionPilotes.pilotes,
        libreTags: ficheActionLibreTags.libreTags,
        thematiques: ficheActionThematiques.thematiques,
        indicateurs: ficheActionIndicateurs.indicateurs,
        sousThematiques: ficheActionSousThematiques.sousThematiques,
        structures: ficheActionStructureTags.structureTags,
        financeurs: ficheActionFinanceurTags.financeurTags,
        effetsAttendus: ficheActionEffetsAttendus.effetsAttendus,
        referents: ficheActionReferent.referents,
        services: ficheActionServices.services,
        axes: ficheActionAxes.axes,
        plans: ficheActionAxes.plans,
        etapes: ficheActionEtapes.etapes,
        notes: ficheActionNotes.notes,
        mesures: ficheActionMesures.mesures,
        sharedWithCollectivites: ficheActionSharings.sharedWithCollectivites,
        fichesLiees: ficheActionFichesLiees.fichesLiees,
        docs: ficheActionDocs.docs,
        budgets: ficheActionBudgets.budgets,
        actionImpactId: actionImpactActionTable.actionImpactId,
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
        ficheActionServices,
        eq(ficheActionServices.ficheId, ficheActionTable.id)
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
        ficheActionSharings,
        eq(ficheActionSharings.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        collectiviteTable,
        eq(collectiviteTable.id, ficheActionTable.collectiviteId)
      )
      .leftJoin(
        ficheActionFichesLiees,
        eq(ficheActionFichesLiees.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionDocs,
        eq(ficheActionDocs.ficheId, ficheActionTable.id)
      )
      .leftJoin(
        ficheActionBudgets,
        eq(ficheActionBudgets.ficheId, ficheActionTable.id)
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
      .leftJoin(
        actionImpactActionTable,
        eq(actionImpactActionTable.actionId, sql`${ficheActionTable.id}::text`)
      )
      .where(inArray(ficheActionTable.id, ficheIds));

    if (queryOptions?.sort) {
      //This is added to preserve the order from the ficheIds array
      query.orderBy(
        sql`array_position(ARRAY[${sql.join(
          ficheIds.map((id) => sql`${id}`),
          sql`, `
        )}]::int[], ${ficheActionTable.id})`
      );
    }
    const data = await query;
    return { data, count };
  }

  private getTimeColumn(typePeriode?: TypePeriodeEnum) {
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

  private getHasNoPlanCondition(
    noPlan: boolean | undefined,
    collectiviteId: number | null
  ): SQLWrapper | undefined {
    if (isNil(noPlan)) {
      return;
    }
    const planQuery = this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .where(
        and(
          eq(ficheActionAxeTable.ficheId, ficheActionTable.id),
          collectiviteId
            ? eq(axeTable.collectiviteId, collectiviteId)
            : undefined
        )
      );

    return noPlan ? notExists(planQuery) : exists(planQuery);
  }

  private getIdentifiedPlanCondition(
    planIds: number[] | undefined
  ): SQLWrapper | undefined {
    if (isNil(planIds)) {
      return;
    }
    const planQuery = this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .where(
        and(
          eq(ficheActionAxeTable.ficheId, ficheActionTable.id),
          or(inArray(axeTable.plan, planIds), inArray(axeTable.id, planIds))
        )
      );

    return exists(planQuery);
  }

  private getMultiplePlansCondition(
    multiplePlans: boolean | undefined
  ): SQLWrapper | undefined {
    if (isNil(multiplePlans)) {
      return;
    }
    if (multiplePlans) {
      // Check if fiche belongs to multiple plans by counting distinct plans
      const planCountQuery = this.databaseService.db
        .select({
          ficheId: ficheActionAxeTable.ficheId,
        })
        .from(ficheActionAxeTable)
        .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
        .where(eq(ficheActionAxeTable.ficheId, ficheActionTable.id))
        .groupBy(ficheActionAxeTable.ficheId)
        .having(
          gt(sql`count(distinct COALESCE(${axeTable.plan}, ${axeTable.id}))`, 1)
        );

      return exists(planCountQuery);
    } else {
      // Check if fiche belongs to only one plan or no plans
      const planCountQuery = this.databaseService.db
        .select({
          ficheId: ficheActionAxeTable.ficheId,
        })
        .from(ficheActionAxeTable)
        .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
        .where(eq(ficheActionAxeTable.ficheId, ficheActionTable.id))
        .groupBy(ficheActionAxeTable.ficheId)
        .having(
          lte(
            sql`count(distinct COALESCE(${axeTable.plan}, ${axeTable.id}))`,
            1
          )
        );

      return exists(planCountQuery);
    }
  }

  private getHasNoLinkedEntityCondition<T extends TableConfig>(
    noLinkedEntity: boolean | undefined,
    linkedTable: Table<T>,
    ficheIdColumn: T['columns'][keyof T['columns']]
  ): SQLWrapper | undefined {
    if (isNil(noLinkedEntity)) {
      return;
    }
    return this.getHasAnyLinkedEntityCondition(
      !noLinkedEntity,
      linkedTable,
      ficheIdColumn
    );
  }

  /**
   * Creates a condition to check for the existence of related entities.
   *
   * @param hasLinkedEntity - Whether to check for existence (true) or non-existence (false)
   * @param linkedTable - The related table to check against
   * @param ficheIdColumn - The column in the related table that links to ficheActionTable.id
   * @returns SQLWrapper condition or undefined if hasLinkedEntity is null/undefined
   */
  private getHasAnyLinkedEntityCondition<T extends TableConfig>(
    hasLinkedEntity: boolean | undefined,
    linkedTable: Table<T>,
    ficheIdColumn: T['columns'][keyof T['columns']]
  ): SQLWrapper | undefined {
    if (isNil(hasLinkedEntity)) {
      return;
    }
    const linkedEntityQuery = this.databaseService.db
      .select({
        ficheId: ficheIdColumn,
      })
      .from(linkedTable)
      .where(eq(ficheIdColumn, ficheActionTable.id));

    return hasLinkedEntity
      ? exists(linkedEntityQuery)
      : notExists(linkedEntityQuery);
  }

  private getHasIdentifiedLinkedEntityCondition<T extends TableConfig>(
    linkedTable: Table<T>,
    ficheIdColumn: T['columns'][keyof T['columns']],
    entityIdColumn: T['columns'][keyof T['columns']],
    entityIds: number[] | string[] | undefined
  ): SQLWrapper | undefined {
    if (isNil(entityIds)) {
      return;
    }
    const linkedEntityQuery = this.databaseService.db
      .select({
        ficheId: ficheIdColumn,
      })
      .from(linkedTable)
      .where(
        and(
          eq(ficheIdColumn, ficheActionTable.id),
          inArray(entityIdColumn, entityIds)
        )
      );

    return exists(linkedEntityQuery);
  }

  private addTextSearchCondition(
    conditions: (SQLWrapper | SQL | undefined)[],
    column: SQL,
    searchText?: string
  ) {
    if (searchText) {
      conditions.push(
        sql`unaccent(${column}) ilike unaccent(${`%${searchText}%`})`
      );
    }
  }

  private formatLogs(filters: ListFichesRequestFilters): string {
    const filterEntries = Object.entries(filters).filter(([_, value]) => value);

    const MAX_ITEMS_TO_SHOW = 10;

    if (filterEntries.length > MAX_ITEMS_TO_SHOW) {
      return `${filterEntries.length} filtres appliqués`;
    }

    return filterEntries
      .map(([name, value]) => {
        if (Array.isArray(value)) {
          if (value.length > MAX_ITEMS_TO_SHOW) {
            return `${name}, ${value.length} éléments`;
          }
          return `${name}: ${value.join(',')}`;
        }
        return `${name}: ${value}`;
      })
      .join(', ');
  }

  private getHasAnyNotNullValueCondition(
    anyNotNullValue: boolean | undefined,
    column: Column
  ): SQLWrapper | SQL | undefined {
    if (!isNil(anyNotNullValue)) {
      return anyNotNullValue ? isNotNull(column) : isNull(column);
    }
  }

  private getNullableFieldCondition(
    column: Column,
    noValueFilter: boolean | undefined,
    specificValues: any[] | undefined
  ): SQLWrapper | SQL | undefined {
    if (noValueFilter && specificValues?.length) {
      // If both conditions are present, use OR logic since a field cannot be both NULL and have a value
      return or(isNull(column), inArray(column, specificValues));
    }
    if (!isNil(noValueFilter)) {
      return noValueFilter ? isNull(column) : isNotNull(column);
    }
    if (specificValues?.length) {
      return inArray(column, specificValues);
    }
  }

  private getConditions(
    collectiviteId: number | null,
    filters: ListFichesRequestFilters = {}
  ): (SQLWrapper | SQL | undefined)[] {
    const conditions: (SQLWrapper | SQL | undefined)[] = [];

    if (collectiviteId) {
      conditions.push(
        or(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          this.getHasIdentifiedLinkedEntityCondition(
            ficheActionSharingTable,
            ficheActionSharingTable.ficheId,
            ficheActionSharingTable.collectiviteId,
            [collectiviteId]
          )
        )
      );
    }

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionAxeTable,
        ficheActionAxeTable.ficheId,
        ficheActionAxeTable.axeId,
        filters.axesId
      )
    );

    if (filters.ficheIds?.length) {
      conditions.push(inArray(ficheActionTable.id, filters.ficheIds));
    }

    conditions.push(
      this.getNullableFieldCondition(
        ficheActionTable.statut,
        filters.noStatut,
        filters.statuts
      )
    );

    conditions.push(
      this.getNullableFieldCondition(
        ficheActionTable.priorite,
        filters.noPriorite,
        filters.priorites
      )
    );

    if (filters.hasBudgetPrevisionnel) {
      conditions.push(isNotNull(ficheActionTable.budgetPrevisionnel));
    }
    if (filters.ameliorationContinue) {
      conditions.push(eq(ficheActionTable.ameliorationContinue, true));
    }
    if (!isNil(filters.restreint)) {
      conditions.push(eq(ficheActionTable.restreint, filters.restreint));
    }

    if (filters.cibles?.length) {
      conditions.push(arrayOverlaps(ficheActionTable.cibles, filters.cibles));
    }
    if (filters.modifiedSince) {
      const modifiedSinceDate = getModifiedSinceDate(filters.modifiedSince);
      conditions.push(gte(ficheActionTable.modifiedAt, modifiedSinceDate));
    }
    if (filters.modifiedAfter) {
      conditions.push(gte(ficheActionTable.modifiedAt, filters.modifiedAfter));
    }

    if (filters.debutPeriode) {
      conditions.push(
        gte(this.getTimeColumn(filters.typePeriode), filters.debutPeriode)
      );
    }

    if (filters.finPeriode) {
      conditions.push(
        lte(this.getTimeColumn(filters.typePeriode), filters.finPeriode)
      );
    }

    if (filters.hasAtLeastBeginningOrEndDate) {
      conditions.push(
        or(
          isNotNull(ficheActionTable.dateDebut),
          isNotNull(ficheActionTable.dateFin)
        )
      );
    }

    conditions.push(
      this.getHasAnyNotNullValueCondition(
        filters.hasDateDeFinPrevisionnelle,
        ficheActionTable.dateFin
      )
    );

    conditions.push(
      this.getHasAnyLinkedEntityCondition(
        filters.hasIndicateurLies,
        ficheActionIndicateurTable,
        ficheActionIndicateurTable.ficheId
      )
    );
    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionIndicateurTable,
        ficheActionIndicateurTable.ficheId,
        ficheActionIndicateurTable.indicateurId,
        filters.indicateurIds
      )
    );

    conditions.push(
      this.getHasAnyLinkedEntityCondition(
        filters.hasMesuresLiees,
        ficheActionActionTable,
        ficheActionActionTable.ficheId
      )
    );

    conditions.push(
      this.getHasAnyLinkedEntityCondition(
        filters.hasNoteDeSuivi,
        ficheActionNoteTable,
        ficheActionNoteTable.ficheId
      )
    );

    if (filters.anneesNoteDeSuivi) {
      const dateList = filters.anneesNoteDeSuivi?.map(
        (year) => new Date(year).toISOString().split('T')[0]
      );
      conditions.push(
        this.getHasIdentifiedLinkedEntityCondition(
          ficheActionNoteTable,
          ficheActionNoteTable.ficheId,
          ficheActionNoteTable.dateNote,
          dateList
        )
      );
    }

    conditions.push(
      this.getHasAnyLinkedEntityCondition(
        filters.sharedWithCollectivites,
        ficheActionSharingTable,
        ficheActionSharingTable.ficheId
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionPartenaireTagTable,
        ficheActionPartenaireTagTable.ficheId,
        ficheActionPartenaireTagTable.partenaireTagId,
        filters.partenaireIds
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionFinanceurTagTable,
        ficheActionFinanceurTagTable.ficheId,
        ficheActionFinanceurTagTable.financeurTagId,
        filters.financeurIds
      )
    );

    const servicePiloteConditions: (SQLWrapper | SQL | undefined)[] = [];
    servicePiloteConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noServicePilote,
        ficheActionServiceTagTable,
        ficheActionServiceTagTable.ficheId
      )
    );
    servicePiloteConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionServiceTagTable,
        ficheActionServiceTagTable.ficheId,
        ficheActionServiceTagTable.serviceTagId,
        filters.servicePiloteIds
      )
    );
    conditions.push(or(...servicePiloteConditions));

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionStructureTagTable,
        ficheActionStructureTagTable.ficheId,
        ficheActionStructureTagTable.structureTagId,
        filters.structurePiloteIds
      )
    );

    const libreTagsConditions: (SQLWrapper | SQL | undefined)[] = [];
    libreTagsConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noTag,
        ficheActionLibreTagTable,
        ficheActionLibreTagTable.ficheId
      )
    );
    libreTagsConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionLibreTagTable,
        ficheActionLibreTagTable.ficheId,
        ficheActionLibreTagTable.libreTagId,
        filters.libreTagsIds
      )
    );
    conditions.push(or(...libreTagsConditions));

    if (filters.mesureIds?.length) {
      conditions.push(
        this.getHasIdentifiedLinkedEntityCondition(
          ficheActionActionTable,
          ficheActionActionTable.ficheId,
          ficheActionActionTable.actionId,
          filters.mesureIds
        )
      );
    }

    if (filters.linkedFicheIds?.length) {
      const linkedFicheConditions: (SQLWrapper | SQL | undefined)[] = [];
      linkedFicheConditions.push(
        this.getHasIdentifiedLinkedEntityCondition(
          ficheActionLienTable,
          ficheActionLienTable.ficheUne,
          ficheActionLienTable.ficheDeux,
          filters.linkedFicheIds
        )
      );
      linkedFicheConditions.push(
        this.getHasIdentifiedLinkedEntityCondition(
          ficheActionLienTable,
          ficheActionLienTable.ficheDeux,
          ficheActionLienTable.ficheUne,
          filters.linkedFicheIds
        )
      );
      conditions.push(or(...linkedFicheConditions));
    }

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionThematiqueTable,
        ficheActionThematiqueTable.ficheId,
        ficheActionThematiqueTable.thematiqueId,
        filters.thematiqueIds
      )
    );

    conditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionSousThematiqueTable,
        ficheActionSousThematiqueTable.ficheId,
        ficheActionSousThematiqueTable.thematiqueId,
        filters.sousThematiqueIds
      )
    );

    const planConditions: (SQLWrapper | SQL | undefined)[] = [];
    planConditions.push(
      this.getHasNoPlanCondition(filters.noPlan, collectiviteId)
    );
    planConditions.push(this.getIdentifiedPlanCondition(filters.planActionIds));
    planConditions.push(
      this.getMultiplePlansCondition(filters.doesBelongToSeveralPlans)
    );

    conditions.push(or(...planConditions));

    const piloteConditions: (SQLWrapper | SQL | undefined)[] = [];
    piloteConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noPilote,
        ficheActionPiloteTable,
        ficheActionPiloteTable.ficheId
      )
    );
    piloteConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionPiloteTable,
        ficheActionPiloteTable.ficheId,
        ficheActionPiloteTable.tagId,
        filters.personnePiloteIds
      )
    );
    piloteConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionPiloteTable,
        ficheActionPiloteTable.ficheId,
        ficheActionPiloteTable.userId,
        filters.utilisateurPiloteIds
      )
    );
    conditions.push(or(...piloteConditions));

    const referentConditions: (SQLWrapper | SQL | undefined)[] = [];
    referentConditions.push(
      this.getHasNoLinkedEntityCondition(
        filters.noReferent,
        ficheActionReferentTable,
        ficheActionReferentTable.ficheId
      )
    );
    referentConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionReferentTable,
        ficheActionReferentTable.ficheId,
        ficheActionReferentTable.userId,
        filters.utilisateurReferentIds
      )
    );
    referentConditions.push(
      this.getHasIdentifiedLinkedEntityCondition(
        ficheActionReferentTable,
        ficheActionReferentTable.ficheId,
        ficheActionReferentTable.tagId,
        filters.personneReferenteIds
      )
    );
    conditions.push(or(...referentConditions));

    const textSearchConditions: (SQLWrapper | SQL)[] = [];
    if (filters.texteNomOuDescription) {
      this.addTextSearchCondition(
        textSearchConditions,
        sql`${ficheActionTable.titre}`,
        filters.texteNomOuDescription
      );
      this.addTextSearchCondition(
        textSearchConditions,
        sql`${ficheActionTable.description}`,
        filters.texteNomOuDescription
      );
      conditions.push(or(...textSearchConditions));
    }

    return conditions;
  }

  async count(collectiviteId: number): Promise<number> {
    const result = await this.databaseService.db
      .select({
        count: count(),
      })
      .from(ficheActionTable)
      .where(eq(ficheActionTable.collectiviteId, collectiviteId));
    return result[0]?.count ?? 0;
  }

  /**
   * Get fiches actions resumes from the collectivity matching the given filters.
   * Also returns additional data about fetched fiches actions.
   * @param collectiviteId ID of the collectivity
   * @param filters filters to apply
   * @param queryOptions sorting, limit and pagination options
   * @return an array of summarized fiches actions with count, next page, number of pages and data
   */
  async getFichesActionResumes(
    {
      collectiviteId,
      filters,
    }: {
      collectiviteId: number;
      filters: ListFichesRequestFilters;
    },
    queryOptions?: QueryOptionsSchema
  ): Promise<{
    count: number;
    nextPage: number | null;
    nbOfPages: number;
    data: FicheWithRelations[];
  }> {
    const filterSummary = filters ? this.formatLogs(filters) : '';
    this.logger.log(
      `Récupération des fiches actions résumées pour la collectivité ${collectiviteId} ${
        filterSummary ? `(${filterSummary})` : ''
      }`
    );
    const { data, count } = await this.listFichesQuery(
      collectiviteId,
      filters,
      queryOptions
    );

    if (queryOptions?.limit === 'all' || queryOptions === undefined) {
      return {
        count,
        nextPage: null,
        nbOfPages: 1,
        data,
      };
    }
    const { page, limit } = queryOptions;

    const nextPage = count > page * limit ? page + 1 : null;
    const nbOfPages = Math.ceil(count / limit);

    return {
      count,
      nextPage,
      nbOfPages,
      data,
    };
  }
}
