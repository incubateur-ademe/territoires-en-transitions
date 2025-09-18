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
import { planPiloteTable } from '@/backend/plans/fiches/shared/models/plan-pilote.table';
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
import { LIMIT_DEFAULT, PAGE_DEFAULT } from '@/backend/utils/pagination.schema';
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
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  not,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { isNil } from 'es-toolkit';
import { ficheActionEtapeTable } from '../fiche-action-etape/fiche-action-etape.table';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import {
  FicheWithRelations,
  FicheWithRelationsAndCollectivite,
} from './fiche-action-with-relations.dto';
import {
  ListFichesRequestWithoutLimit,
  ListFichesResponse,
  PaginationWithLimitSchema,
} from './list-fiches.request';

@Injectable()
export default class ListFichesService {
  private readonly logger = new Logger(ListFichesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectiviteService: CollectivitesService,
    private readonly fichePermissionService: FicheActionPermissionsService
  ) { }

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
          SousThematique[]
        >`array_agg(json_build_object('id', ${ficheActionSousThematiqueTable.thematiqueId}, 'nom', ${sousThematiqueTable.nom}, 'thematiqueId', ${sousThematiqueTable.thematiqueId} ))`.as(
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
          TagWithOptionalCollectivite[]
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
          EffetAttendu[]
        >`array_agg(json_build_object('id', ${ficheActionEffetAttenduTable.effetAttenduId}, 'nom', ${effetAttenduTable.nom}, 'notice', ${effetAttenduTable.notice} ))`.as(
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
          TagWithOptionalCollectivite[]
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
          TagWithOptionalCollectivite[]
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
        axespilotes: sql<number[]>`array_agg(
              ${planPiloteTable.userId}
          )`.as('axespilotes')
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, and(eq(axeTable.id, ficheActionAxeTable.axeId)))
      .leftJoin(planPiloteTable, eq(planPiloteTable.planId, ficheActionAxeTable.axeId))
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

  private getFicheActionServicesQuery() {
    return this.databaseService.db
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
        anneesNotes: sql<
          string[]
        >`array_agg(${ficheActionNoteTable.dateNote})`.as('annees_notes'),
      })
      .from(ficheActionNoteTable)
      .groupBy(ficheActionNoteTable.ficheId)
      .as('ficheActionNotes');
  }

  private getFicheActionMesuresQuery() {
    return this.databaseService.db
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
      )
      .groupBy(ficheActionActionTable.ficheId)
      .as('ficheActionMesures');
  }

  private getFicheActionSharingsQuery() {
    return this.databaseService.db
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
      )
      .groupBy(ficheActionSharingTable.ficheId)
      .as('ficheActionSharings');
  }

  private getFicheActionFichesLieesQuery() {
    return this.databaseService.db
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

  private getFicheActionBudgetsQuery() {
    return this.databaseService.db
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
      .from(ficheActionBudgetTable)
      .groupBy(ficheActionBudgetTable.ficheId)
      .as('ficheActionBudgets');
  }

  async getFicheById(
    ficheId: number,
    addCollectiviteData?: boolean,
    user?: AuthUser
  ): Promise<FicheWithRelations | FicheWithRelationsAndCollectivite> {
    this.logger.log(`Récupération de la fiche action ${ficheId}`);

    const { data: fichesAction } = await this.listFichesQuery({
      collectiviteId: null,
      filters: {
        ficheIds: [ficheId],
      },
      user
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
      ficheAction.collectivite = collectivite.collectivite as Collectivite;
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

  private async listFichesQuery(params: {
    collectiviteId: number | null;
    axesId?: number[];
    filters?: ListFichesRequestFilters;
    queryOptions?: Partial<PaginationWithLimitSchema>;
    user?: AuthUser
  }): Promise<{ data: FicheWithRelationsAndCollectivite[]; count: number }>;

  private async listFichesQuery({
    collectiviteId,
    axesId,
    filters,
    lightVersion,
    user
  }: {
    collectiviteId: number | null;
    axesId?: number[];
    filters?: ListFichesRequestFilters;
    queryOptions?: Partial<PaginationWithLimitSchema>;
    lightVersion: true;
    user?: AuthUser;
  }): Promise<{
    data: { id: number; pilotes: FicheWithRelations['pilotes'], canBeModifiedByCurrentUser?: boolean }[];
    count: number;
  }>;

  private async listFichesQuery({
    collectiviteId,
    axesId,
    filters,
    queryOptions,
    lightVersion,
    user
  }: {
    collectiviteId: number | null;
    axesId?: number[];
    filters?: ListFichesRequestFilters;
    queryOptions?: Partial<PaginationWithLimitSchema>;
    lightVersion?: boolean;
    user?: AuthUser;
  }): Promise<{
    data: FicheWithRelationsAndCollectivite[];
    count: number;
  }> {
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
    const ficheActionServices = this.getFicheActionServicesQuery();
    const ficheActionAxes = this.getFicheActionAxesQuery();
    const ficheActionEtapes = this.getFicheActionEtapesQuery();
    const ficheActionNotes = this.getFicheActionNotesQuery();
    const ficheActionMesures = this.getFicheActionMesuresQuery();
    const ficheActionFichesLiees = this.getFicheActionFichesLieesQuery();
    const ficheActionDocs = this.getFicheActionsDocsQuery();
    const ficheActionSharings = this.getFicheActionSharingsQuery();
    const ficheActionBudgets = this.getFicheActionBudgetsQuery();

    const conditions: (SQLWrapper | SQL | undefined)[] = [];

    // Si on a un linkedFicheIds, on veut récupérer toutes les fiches liées même si elles ne sont pas dans la collectivité
    if (collectiviteId && !filters?.linkedFicheIds?.length) {
      // Vraiment étrange, probable bug de drizzle, on ne peut pas lui donner le tableau directement
      const sqlNumberArray = `{${collectiviteId}}`;
      conditions.push(
        or(
          eq(ficheActionTable.collectiviteId, collectiviteId),
          arrayOverlaps(
            ficheActionSharings.sharedWithCollectiviteIds,
            sql`${sqlNumberArray}`
          )
        )
      );
    }

    if (filters && Object.keys(filters).length > 0) {
      const filterSummary = this.formatLogs(filters);
      this.logger.log(
        `Récupération des fiches action pour la collectivité ${collectiviteId} ${filterSummary ? `(filtre(s) appliqué(s): ${filterSummary})` : ''
        }`
      );
      conditions.push(...this.getConditions(filters, collectiviteId));
    } else {
      this.logger.log(
        `Récupération des toutes les fiches action pour la collectivité ${collectiviteId}`
      );
    }

    const dcpModifiedBy = aliasedTable(dcpTable, 'dcpModifiedBy');

    const query = this.databaseService.db
      .select({
        count: sql<number>`(count(*) over())::int`,
        pilotes: ficheActionPilotes.pilotes,
        ...(user ? {
          canBeModifiedByCurrentUser: sql<boolean>`CASE WHEN ${user.id}::uuid = ANY(${ficheActionPilotes.piloteUserIds}) THEN true WHEN ${user.id}::uuid = ANY(${ficheActionAxes.axespilotes}) THEN true ELSE false END`,
        } : {}),
        ...(lightVersion
          ? {
            id: ficheActionTable.id, ...(user ? {
              canBeModifiedByCurrentUser: sql<boolean>`CASE WHEN ${user.id}::uuid = ANY(${ficheActionPilotes.piloteUserIds}) THEN true WHEN ${user.id}::uuid = ANY(${ficheActionAxes.axespilotes}) THEN true ELSE false END`,
            } : {})
          }
          : {
            ...getTableColumns(ficheActionTable),
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
            collectiviteNom: collectiviteTable.nom,
            tempsDeMiseEnOeuvre: sql<TempsDeMiseEnOeuvre>`CASE WHEN ${tempsDeMiseEnOeuvreTable.id} IS NULL THEN NULL ELSE json_build_object('id', ${tempsDeMiseEnOeuvreTable.id}, 'nom', ${tempsDeMiseEnOeuvreTable.nom}) END`,
            partenaires: sql<
              TagWithOptionalCollectivite[]
            >`COALESCE(${ficheActionPartenaireTags.partenaireTags}, ARRAY[]::json[])`,
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
            sharedWithCollectivites:
              ficheActionSharings.sharedWithCollectivites,
            fichesLiees: ficheActionFichesLiees.fichesLiees,
            docs: ficheActionDocs.docs,
            budgets: ficheActionBudgets.budgets,
            actionImpactId: actionImpactActionTable.actionImpactId,

          }),
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
      );

    if (axesId?.length) {
      query.leftJoin(
        ficheActionAxeTable,
        eq(ficheActionAxeTable.ficheId, ficheActionTable.id)
      );
      conditions.push(inArray(ficheActionAxeTable.axeId, axesId));
    }

    // We may make the other leftJoins optional to increase performance,
    // but this one was made conditionnal to avoid duplicate rows of fiches
    // linked to several other fiches (at least two)
    if (filters?.linkedFicheIds?.length) {
      query.leftJoin(
        ficheActionLienTable,
        or(
          eq(ficheActionLienTable.ficheUne, ficheActionTable.id),
          eq(ficheActionLienTable.ficheDeux, ficheActionTable.id)
        )
      );
    }

    query
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
      .where(and(...conditions));

    if (queryOptions?.sort) {
      queryOptions.sort.forEach((sort) => {
        const column =
          sort.field === 'modified_at'
            ? ficheActionTable.modifiedAt
            : sort.field === 'created_at'
              ? ficheActionTable.createdAt
              : ficheActionTable.titre;

        const columnWithCollation =
          column === ficheActionTable.titre
            ? sql`${column} collate numeric_with_case_and_accent_insensitive`
            : column;

        query.orderBy(
          sort.direction === 'asc'
            ? columnWithCollation
            : desc(columnWithCollation)
        );
      });
    }

    if (queryOptions?.page && queryOptions?.limit) {
      query
        .limit(queryOptions.limit)
        .offset((queryOptions.page - 1) * queryOptions.limit);
    }
    const result = await query;
    return {
      data: result.map(
        ({ count, ...rest }) => rest
      ) as FicheWithRelationsAndCollectivite[],
      count: result[0]?.count ?? 0,
    };
  }

  private addArrayOverlapsConditionForStringArray(
    conditions: (SQLWrapper | SQL | undefined)[],
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
    conditions: (SQLWrapper | SQL | undefined)[],
    column: SQL,
    filter?: number[]
  ) {
    if (filter?.length) {
      // Vraiment étrange, probable bug de drizzle, on ne peut pas lui donner le tableau directement
      const sqlNumberArray = `{${filter.join(',')}}`;
      conditions.push(arrayOverlaps(column, sql`${sqlNumberArray}`));
    }
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
    const filterEntries = Object.entries(filters).filter(([, value]) => value);

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

  private addNullableFieldCondition(
    conditions: (SQLWrapper | SQL | undefined)[],
    column: SQL | SQLWrapper,
    noValueFilter: boolean | undefined,
    specificValues: (string | number)[] | undefined
  ) {
    if (noValueFilter && specificValues?.length) {
      // If both conditions are present, use OR logic since a field cannot be both NULL and have a value
      return conditions.push(
        or(isNull(column), inArray(column, specificValues))
      );
    }
    if (noValueFilter) {
      return conditions.push(isNull(column));
    }
    if (specificValues?.length) {
      return conditions.push(inArray(column, specificValues));
    }
    return conditions;
  }

  private getConditions(
    filters: ListFichesRequestFilters,
    collectiviteId: number | null
  ): (SQLWrapper | SQL | undefined)[] {
    const conditions: (SQLWrapper | SQL | undefined)[] = [];

    if (filters.ficheIds?.length) {
      conditions.push(inArray(ficheActionTable.id, filters.ficheIds));
    }

    this.addNullableFieldCondition(
      conditions,
      ficheActionTable.statut,
      filters.noStatut,
      filters.statuts
    );

    this.addNullableFieldCondition(
      conditions,
      ficheActionTable.priorite,
      filters.noPriorite,
      filters.priorites
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
    if (filters.hasIndicateurLies === true) {
      conditions.push(isNotNull(sql`indicateur_ids`));
    }
    if (filters.hasIndicateurLies === false) {
      conditions.push(isNull(sql`indicateur_ids`));
    }
    if (filters.hasDateDeFinPrevisionnelle === true) {
      conditions.push(isNotNull(ficheActionTable.dateFin));
    }
    if (filters.hasDateDeFinPrevisionnelle === false) {
      conditions.push(isNull(ficheActionTable.dateFin));
    }
    if (filters.indicateurIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`indicateur_ids`,
        filters.indicateurIds
      );
    }
    if (filters.hasMesuresLiees === true) {
      conditions.push(isNotNull(sql`mesures`));
    }
    if (filters.hasMesuresLiees === false) {
      conditions.push(isNull(sql`mesures`));
    }
    if (filters.hasNoteDeSuivi === true) {
      conditions.push(isNotNull(sql`notes`));
    }
    if (filters.anneesNoteDeSuivi) {
      const dateList = filters.anneesNoteDeSuivi?.map(
        (year) => new Date(year).toISOString().split('T')[0]
      );
      this.addArrayOverlapsConditionForStringArray(
        conditions,
        sql`annees_notes`,
        dateList
      );
    }
    if (filters.sharedWithCollectivites) {
      conditions.push(isNotNull(sql`shared_with_collectivites`));
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

    if (filters.partenaireIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`partenaire_tag_ids`,
        filters.partenaireIds
      );
    }
    if (filters.financeurIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`financeur_tag_ids`,
        filters.financeurIds
      );
    }
    if (filters.servicePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`service_tag_ids`,
        filters.servicePiloteIds
      );
    }
    if (filters.structurePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`structure_tag_ids`,
        filters.structurePiloteIds
      );
    }
    if (filters.libreTagsIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`libre_tag_ids`,
        filters.libreTagsIds
      );
    }
    if (filters.planActionIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`plan_ids`,
        filters.planActionIds
      );
    }
    if (filters.mesureIds?.length) {
      this.addArrayOverlapsConditionForStringArray(
        conditions,
        sql`mesure_ids`,
        filters.mesureIds
      );
    }
    if (filters.linkedFicheIds?.length) {
      conditions.push(
        or(
          isNotNull(ficheActionLienTable.ficheUne),
          isNotNull(ficheActionLienTable.ficheDeux)
        )
      );
      conditions.push(
        or(
          inArray(ficheActionLienTable.ficheDeux, filters.linkedFicheIds),
          inArray(ficheActionLienTable.ficheUne, filters.linkedFicheIds)
        )
      );
      conditions.push(
        not(inArray(ficheActionTable.id, filters.linkedFicheIds))
      );
    }

    if (filters.thematiqueIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`thematique_ids`,
        filters.thematiqueIds
      );
    }
    if (filters.sousThematiqueIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        conditions,
        sql`sous_thematique_ids`,
        filters.sousThematiqueIds
      );
    }
    if (filters.noTag) {
      conditions.push(isNull(sql`libre_tag_ids`));
    }
    if (filters.noPilote) {
      const condition = and(
        isNull(sql`pilote_user_ids`),
        isNull(sql`pilote_tag_ids`)
      );
      conditions.push(condition);
    }
    if (filters.noServicePilote) {
      conditions.push(isNull(sql`service_tag_ids`));
    }
    if (filters.noPlan === true) {
      if (!collectiviteId) {
        conditions.push(isNull(sql`plans`));
      } else {
        const collectiviteIdSqlNumberArray = `{${collectiviteId}}`;
        conditions.push(
          or(
            isNull(sql`plans`),
            not(
              arrayOverlaps(
                sql`axes_collectivite_ids`,
                sql`${collectiviteIdSqlNumberArray}`
              )
            )
          )
        );
      }
    } else if (filters.noPlan === false) {
      if (!collectiviteId) {
        conditions.push(isNotNull(sql`plans`));
      } else {
        const collectiviteIdSqlNumberArray = `{${collectiviteId}}`;
        conditions.push(
          arrayOverlaps(
            sql`axes_collectivite_ids`,
            sql`${collectiviteIdSqlNumberArray}`
          )
        );
      }
    }

    // TODO: make it work for shared collectivite, not simple
    if (filters.doesBelongToSeveralPlans) {
      conditions.push(gt(sql`array_length(plan_ids, 1)`, 1));
    }

    const piloteConditions: (SQLWrapper | SQL | undefined)[] = [];
    if (filters.noPilote) {
      piloteConditions.push(
        and(isNull(sql`pilote_user_ids`), isNull(sql`pilote_tag_ids`))
      );
    }
    if (filters.utilisateurPiloteIds?.length) {
      this.addArrayOverlapsConditionForStringArray(
        piloteConditions,
        sql`pilote_user_ids`,
        filters.utilisateurPiloteIds
      );
    }
    if (filters.personnePiloteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        piloteConditions,
        sql`pilote_tag_ids`,
        filters.personnePiloteIds
      );
    }
    conditions.push(or(...piloteConditions));

    const referentConditions: (SQLWrapper | SQL | undefined)[] = [];
    if (filters.noReferent) {
      referentConditions.push(
        and(isNull(sql`referent_user_ids`), isNull(sql`referent_tag_ids`))
      );
    }
    if (filters.utilisateurReferentIds?.length) {
      this.addArrayOverlapsConditionForStringArray(
        referentConditions,
        sql`referent_user_ids`,
        filters.utilisateurReferentIds
      );
    }
    if (filters.personneReferenteIds?.length) {
      this.addArrayOverlapsConditionForIntArray(
        referentConditions,
        sql`referent_tag_ids`,
        filters.personneReferenteIds
      );
    }
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
  async getFilteredFiches({
    collectiviteId,
    axesId,
    filters,
    queryOptions,
    user
  }: {
    collectiviteId: number;
    axesId?: number[];
    queryOptions?: PaginationWithLimitSchema;
    filters: ListFichesRequestFilters;
    user?: AuthUser;
  }): Promise<ListFichesResponse> {
    const filterSummary = filters ? this.formatLogs(filters) : '';
    this.logger.log(
      `Récupération des fiches actions résumées pour la collectivité ${collectiviteId} ${filterSummary ? `(${filterSummary})` : ''
      }`
    );

    const page = queryOptions?.page ?? PAGE_DEFAULT;
    const limit = queryOptions?.limit ?? LIMIT_DEFAULT;

    const { data: fiches, count } = await this.listFichesQuery({
      collectiviteId,
      axesId,
      filters,
      queryOptions: { sort: queryOptions?.sort, page, limit },
      user
    });

    const nextPage = count > page * limit ? page + 1 : null;
    const numberOfPages = Math.ceil(count / limit);

    return {
      count,
      nextPage,
      numberOfPages,
      fiches,
    };
  }

  async getAllFilteredFiches({
    collectiviteId,
    axesId,
    filters,
    queryOptions,
  }: ListFichesRequestWithoutLimit,
    user?: AuthUser): Promise<{
      count: number;
      fiches: { id: number; pilotes: FicheWithRelations['pilotes'], canBeModifiedByCurrentUser?: boolean }[];
    }> {
    const filterSummary = filters ? this.formatLogs(filters) : '';
    this.logger.log(
      `Récupération de tous les ids de fiches actions pour la collectivité ${collectiviteId} ${filterSummary ? `(${filterSummary})` : ''
      }`
    );


    const { data: fiches, count } = await this.listFichesQuery({
      collectiviteId,
      axesId,
      filters,
      queryOptions,
      lightVersion: true,
      user
    });
    return {
      count,
      fiches,
    };
  }
}
