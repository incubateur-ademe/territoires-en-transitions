import { Injectable } from '@nestjs/common';
import { annexeTable } from '@tet/backend/collectivites/documents/models/annexe.table';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { instanceGouvernanceTagTable } from '@tet/backend/collectivites/tags/instance-gouvernance-tag.table';
import { libreTagTable } from '@tet/backend/collectivites/tags/libre-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { ficheActionNoteTable } from '@tet/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionEffetAttenduTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionLibreTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-libre-tag.table';
import { ficheActionLienTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-partenaire-tag.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { effetAttenduTable } from '@tet/backend/shared/effet-attendu/effet-attendu.table';
import { sousThematiqueTable } from '@tet/backend/shared/thematiques/sous-thematique.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  PersonneTagOrUserWithContacts,
  Tag,
  TagWithCollectiviteId,
} from '@tet/domain/collectivites';
import { FicheNote, FichePlan, Financeur } from '@tet/domain/plans';
import { EffetAttendu, SousThematique } from '@tet/domain/shared';
import { aliasedTable, and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { ficheActionEtapeTable } from '../fiche-action-etape/fiche-action-etape.table';
import { ficheActionActionTable } from '../shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionInstanceGouvernanceTableTag } from '../shared/models/fiche-action-instance-gouvernance';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { ficheRecursiveAxeView } from '../shared/models/fiche-recursive-axe.view';

/**
 * Sous-requêtes agrégeant, par fiche, chacune des relations renvoyées par
 * `listFiches` (pilotes, axes, plans, tags…). Elles sont jointes à la requête
 * principale de `ListFichesRepository`.
 */
@Injectable()
export class ListFichesRelationsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  getFicheActionSousThematiquesQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionSousThematiqueTable.ficheId,
        sousThematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionSousThematiqueTable.thematiqueId})`.as(
          'sous_thematique_ids'
        ),
        sousThematiques: sql<
          SousThematique[]
        >`array_agg(json_build_object('id', ${ficheActionSousThematiqueTable.thematiqueId}, 'nom', ${sousThematiqueTable.nom}, 'thematiqueId', ${sousThematiqueTable.thematiqueId} ) ORDER BY ${sousThematiqueTable.nom} ASC)`.as(
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

  getFicheActionThematiquesQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionThematiqueTable.ficheId,
        thematiqueIds: sql<
          number[]
        >`array_agg(${ficheActionThematiqueTable.thematiqueId})`.as(
          'thematique_ids'
        ),
        thematiques: sql<
          Tag[]
        >`array_agg(json_build_object('id', ${ficheActionThematiqueTable.thematiqueId}, 'nom', ${thematiqueTable.nom} ) ORDER BY ${thematiqueTable.nom} ASC)`.as(
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

  getFicheActionIndicateursQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
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

  getFicheActionReferentTagsQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
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
      .leftJoin(dcpTable, eq(dcpTable.id, ficheActionReferentTable.userId));

    query.where(inArray(ficheActionReferentTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionReferentTable.ficheId)
      .as('ficheActionReferents');
  }

  getFicheActionEffetsAttendusQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionEffetAttenduTable.ficheId,
        effetAttenduIds: sql<
          number[]
        >`array_agg(${ficheActionEffetAttenduTable.effetAttenduId})`.as(
          'effet_attendu_ids'
        ),
        effetsAttendus: sql<
          EffetAttendu[]
        >`array_agg(json_build_object('id', ${ficheActionEffetAttenduTable.effetAttenduId}, 'nom', ${effetAttenduTable.nom}, 'notice', ${effetAttenduTable.notice} ) ORDER BY ${effetAttenduTable.nom} ASC)`.as(
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

  getFicheActionFinanceurTagsQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionFinanceurTagTable.ficheId,
        financeurTagIds: sql<
          number[]
        >`array_agg(${ficheActionFinanceurTagTable.financeurTagId})`.as(
          'financeur_tag_ids'
        ),
        financeurTags: sql<Financeur[]>`array_agg(
          json_build_object(
            'financeurTagId', ${ficheActionFinanceurTagTable.financeurTagId},
            'ficheId', ${ficheActionFinanceurTagTable.ficheId},
            'montantTtc', ${ficheActionFinanceurTagTable.montantTtc},
            'financeurTag', json_build_object(
              'id', ${financeurTagTable.id},
              'nom', ${financeurTagTable.nom}
            )
          )
          ORDER BY ${financeurTagTable.nom} ASC
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

  getFicheActionLibreTagsQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionLibreTagTable.ficheId,
        libreTagIds: sql<
          number[]
        >`array_agg(${ficheActionLibreTagTable.libreTagId})`.as(
          'libre_tag_ids'
        ),
        libreTags: sql<
          Tag[]
        >`array_agg(json_build_object('id', ${ficheActionLibreTagTable.libreTagId}, 'nom', ${libreTagTable.nom} ) ORDER BY ${libreTagTable.nom} ASC)`.as(
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

  getFicheActionStructureTagsQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionStructureTagTable.ficheId,
        structureTagIds: sql<
          number[]
        >`array_agg(${ficheActionStructureTagTable.structureTagId})`.as(
          'structure_tag_ids'
        ),
        structureTags: sql<
          Tag[]
        >`array_agg(json_build_object('id', ${ficheActionStructureTagTable.structureTagId}, 'nom', ${structureTagTable.nom} ) ORDER BY ${structureTagTable.nom} ASC)`.as(
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

  getFicheActionInstanceGouvernanceQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionInstanceGouvernanceTableTag.ficheId,
        instanceGouvernance: sql<
          {
            id: number;
            nom: string;
            collectiviteId: number;
            createdAt: string | null;
            createdBy: string | null;
          }[]
        >`json_agg(to_jsonb(${instanceGouvernanceTagTable}.*) ORDER BY ${instanceGouvernanceTagTable.nom} ASC)`.as(
          'instance_de_gouvernance'
        ),
      })
      .from(ficheActionInstanceGouvernanceTableTag)
      .innerJoin(
        instanceGouvernanceTagTable,
        eq(
          instanceGouvernanceTagTable.id,
          ficheActionInstanceGouvernanceTableTag.instanceGouvernanceTagId
        )
      );

    query.where(
      inArray(ficheActionInstanceGouvernanceTableTag.ficheId, ficheIds)
    );

    return query
      .groupBy(ficheActionInstanceGouvernanceTableTag.ficheId)
      .as('ficheActionInstanceGouvernance');
  }

  getFicheActionPartenaireTagsQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionPartenaireTagTable.ficheId,
        partenaireTagIds: sql<
          number[]
        >`array_agg(${ficheActionPartenaireTagTable.partenaireTagId} ORDER BY ${partenaireTagTable.nom} ASC)`.as(
          'partenaire_tag_ids'
        ),
        partenaireTags: sql<Tag[]>`
            array_agg(
              json_build_object(
                'id', ${ficheActionPartenaireTagTable.partenaireTagId},
                'nom', ${partenaireTagTable.nom}
              )
              ORDER BY ${partenaireTagTable.nom} ASC
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

  getFicheActionAxesQuery(
    ficheIds: number[],
    withAxesAncestors?: boolean,
    tx?: Transaction
  ) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheRecursiveAxeView.ficheId,
        axes: sql<
          {
            id: number;
            nom: string;
            collectiviteId: number;
            parentId: number | null;
            planId: number | null;
          }[]
        >`array_agg(json_build_object('id', ${ficheRecursiveAxeView.id}, 'nom', ${ficheRecursiveAxeView.nom}, 'collectiviteId', ${ficheRecursiveAxeView.collectiviteId}, 'parentId', ${ficheRecursiveAxeView.parentId}, 'planId', ${ficheRecursiveAxeView.planId}, 'axeLevel', ${ficheRecursiveAxeView.axeLevel}))`.as(
          'axes'
        ),
      })
      .from(ficheRecursiveAxeView);

    const filterByFicheId = inArray(ficheRecursiveAxeView.ficheId, ficheIds);
    query.where(
      withAxesAncestors
        ? filterByFicheId
        : and(filterByFicheId, eq(ficheRecursiveAxeView.axeLevel, 1))
    );

    return query.groupBy(ficheRecursiveAxeView.ficheId).as('ficheActionAxes');
  }

  getFicheActionPlansQuery(ficheIds: number[], tx?: Transaction) {
    const planTable = aliasedTable(axeTable, 'plan_table');
    const parentAxeTable = aliasedTable(axeTable, 'parent_axe_table');

    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        plans: sql<
          FichePlan[]
        >`array_agg(json_build_object('id', COALESCE(${axeTable.plan}, ${axeTable.id}), 'nom', COALESCE(${planTable.nom}, ${axeTable.nom}), 'collectiviteId', ${axeTable.collectiviteId}, 'type', ${planActionTypeTable.type}))`.as(
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
      .leftJoin(
        planActionTypeTable,
        eq(planActionTypeTable.id, planTable.typeId)
      );

    query.where(inArray(ficheActionAxeTable.ficheId, ficheIds));

    return query.groupBy(ficheActionAxeTable.ficheId).as('ficheActionPlans');
  }

  getFicheActionServicesQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionServiceTagTable.ficheId,
        serviceTagIds: sql<
          number[]
        >`array_agg(${ficheActionServiceTagTable.serviceTagId})`.as(
          'service_tag_ids'
        ),
        services: sql<
          TagWithCollectiviteId[]
        >`array_agg(json_build_object('id', ${serviceTagTable.id}, 'nom', ${serviceTagTable.nom}, 'collectiviteId', ${serviceTagTable.collectiviteId}) ORDER BY ${serviceTagTable.nom} ASC)`.as(
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

  getFicheActionPilotesQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
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
              'prenom', ${dcpTable.prenom},
              'nomFamille', ${dcpTable.nom},
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
      .leftJoin(dcpTable, eq(dcpTable.id, ficheActionPiloteTable.userId));

    query.where(inArray(ficheActionPiloteTable.ficheId, ficheIds));

    return query
      .groupBy(ficheActionPiloteTable.ficheId)
      .as('ficheActionPilotes');
  }

  getFicheActionEtapesQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
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

  getFicheActionNotesQuery(ficheIds: number[], tx?: Transaction) {
    const dcpCreatedBy = aliasedTable(dcpTable, 'dcpNoteCreatedBy');
    const dcpModifiedBy = aliasedTable(dcpTable, 'dcpNoteModifiedBy');

    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionNoteTable.ficheId,
        notes: sql<FicheNote[]>`array_agg(json_build_object(
          'note', ${ficheActionNoteTable.note},
          'dateNote', ${ficheActionNoteTable.dateNote},
          'id', ${ficheActionNoteTable.id},
          'createdAt', ${ficheActionNoteTable.createdAt},
          'modifiedAt', ${ficheActionNoteTable.modifiedAt},
          'createdBy', CASE WHEN ${ficheActionNoteTable.createdBy} IS NULL THEN NULL
            ELSE json_build_object('id', ${ficheActionNoteTable.createdBy}, 'prenom', ${dcpCreatedBy.prenom}, 'nom', ${dcpCreatedBy.nom})
          END,
          'modifiedBy', CASE WHEN ${ficheActionNoteTable.modifiedBy} IS NULL THEN NULL
            ELSE json_build_object('id', ${ficheActionNoteTable.modifiedBy}, 'prenom', ${dcpModifiedBy.prenom}, 'nom', ${dcpModifiedBy.nom})
          END
        ) ORDER BY ${ficheActionNoteTable.dateNote} DESC)`.as('notes'),
        anneesNotes: sql<
          string[]
        >`array_agg(${ficheActionNoteTable.dateNote} ORDER BY ${ficheActionNoteTable.dateNote} DESC)`.as(
          'annees_notes'
        ),
      })
      .from(ficheActionNoteTable)
      .leftJoin(
        dcpCreatedBy,
        eq(dcpCreatedBy.id, ficheActionNoteTable.createdBy)
      )
      .leftJoin(
        dcpModifiedBy,
        eq(dcpModifiedBy.id, ficheActionNoteTable.modifiedBy)
      );

    query.where(inArray(ficheActionNoteTable.ficheId, ficheIds));

    return query.groupBy(ficheActionNoteTable.ficheId).as('ficheActionNotes');
  }

  getFicheActionMesuresQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
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

  getFicheActionSharingsQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
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

  getFicheActionFichesLieesQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
      .select({
        ficheId: ficheActionLienTable.ficheUne,
        fichesLiees: sql<
          Tag[]
        >`array_agg(json_build_object('id', ${ficheActionTable.id}, 'nom', ${ficheActionTable.titre}))`.as(
          'fichesLiees'
        ),
      })
      .from(ficheActionLienTable)
      .leftJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionLienTable.ficheDeux)
      );

    query.where(
      and(
        inArray(ficheActionLienTable.ficheUne, ficheIds),
        eq(ficheActionTable.deleted, false)
      )
    );

    return query
      .groupBy(ficheActionLienTable.ficheUne)
      .as('ficheActionFichesLiees');
  }

  getFicheActionsDocsQuery(ficheIds: number[], tx?: Transaction) {
    const query = (tx || this.databaseService.db)
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
}
