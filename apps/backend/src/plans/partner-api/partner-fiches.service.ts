import { Injectable, NotFoundException } from '@nestjs/common';
import { financeurTagTable } from '@tet/backend/collectivites/tags/financeur-tag.table';
import { partenaireTagTable } from '@tet/backend/collectivites/tags/partenaire-tag.table';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { structureTagTable } from '@tet/backend/collectivites/tags/structure-tag.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { ficheActionBudgetTable } from '@tet/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';
import { ficheActionEtapeTable } from '@tet/backend/plans/fiches/fiche-action-etape/fiche-action-etape.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionEffetAttenduTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-effet-attendu.table';
import { ficheActionFinanceurTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-financeur-tag.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionLienTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-lien.table';
import { ficheActionPartenaireTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-partenaire-tag.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-service-tag.table';
import { ficheActionSousThematiqueTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-sous-thematique.table';
import { ficheActionStructureTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-structure-tag.table';
import { ficheActionThematiqueTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-thematique.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { effetAttenduTable } from '@tet/backend/shared/effet-attendu/effet-attendu.table';
import { tempsDeMiseEnOeuvreTable } from '@tet/backend/shared/models/temps-de-mise-en-oeuvre.table';
import { sousThematiqueTable } from '@tet/backend/shared/thematiques/sous-thematique.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

interface ListFichesFilters {
  planId?: number;
  statut?: string;
  page: number;
  limit: number;
  modifiedSince?: string;
}

@Injectable()
export class PartnerFichesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listFiches(collectiviteId: number, filters: ListFichesFilters) {
    const db = this.databaseService.db;
    const { page, limit } = filters;

    // Base conditions: non-restricted, non-deleted, correct collectivite
    const conditions: SQL[] = [
      eq(ficheActionTable.collectiviteId, collectiviteId),
      eq(ficheActionTable.restreint, false),
      eq(ficheActionTable.deleted, false),
    ];

    if (filters.statut) {
      conditions.push(
        sql`${ficheActionTable.statut} = ${filters.statut}`
      );
    }

    if (filters.modifiedSince) {
      conditions.push(gte(ficheActionTable.modifiedAt, filters.modifiedSince));
    }

    // If filtering by plan, join through fiche_action_axe -> axe
    let ficheIdsFromPlan: number[] | undefined;
    if (filters.planId) {
      const ficheRows = await db
        .selectDistinct({
          ficheId: ficheActionAxeTable.ficheId,
        })
        .from(ficheActionAxeTable)
        .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
        .where(
          sql`COALESCE(${axeTable.plan}, ${axeTable.id}) = ${filters.planId}`
        );
      ficheIdsFromPlan = ficheRows.map((r) => r.ficheId);
      if (ficheIdsFromPlan.length === 0) {
        return {
          data: [],
          pagination: { page, limit, count: 0, nbOfPages: 0 },
        };
      }
      conditions.push(inArray(ficheActionTable.id, ficheIdsFromPlan));
    }

    // Count total
    const [{ total }] = await db
      .select({ total: count() })
      .from(ficheActionTable)
      .where(and(...conditions));

    const totalCount = Number(total);
    const nbOfPages = Math.ceil(totalCount / limit);

    // Get paginated fiche IDs
    const ficheRows = await db
      .select({
        id: ficheActionTable.id,
      })
      .from(ficheActionTable)
      .where(and(...conditions))
      .orderBy(desc(ficheActionTable.modifiedAt), desc(ficheActionTable.id))
      .limit(limit)
      .offset((page - 1) * limit);

    const ficheIds = ficheRows.map((r) => r.id);

    if (ficheIds.length === 0) {
      return {
        data: [],
        pagination: { page, limit, count: totalCount, nbOfPages },
      };
    }

    // Get fiches with base data
    const fiches = await db
      .select({
        id: ficheActionTable.id,
        titre: ficheActionTable.titre,
        description: ficheActionTable.description,
        statut: ficheActionTable.statut,
        priorite: ficheActionTable.priorite,
        dateDebut: ficheActionTable.dateDebut,
        dateFin: ficheActionTable.dateFin,
        budgetPrevisionnel: ficheActionTable.budgetPrevisionnel,
        ameliorationContinue: ficheActionTable.ameliorationContinue,
        createdAt: ficheActionTable.createdAt,
        modifiedAt: ficheActionTable.modifiedAt,
      })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, ficheIds))
      .orderBy(desc(ficheActionTable.modifiedAt), desc(ficheActionTable.id));

    // Load all relations in parallel
    const [
      thematiques,
      sousThematiques,
      pilotes,
      structures,
      plans,
      axes,
      effetsAttendus,
      financeurs,
      indicateurs,
    ] = await Promise.all([
      this.getThematiques(ficheIds),
      this.getSousThematiques(ficheIds),
      this.getPilotes(ficheIds),
      this.getStructures(ficheIds),
      this.getPlans(ficheIds),
      this.getAxes(ficheIds),
      this.getEffetsAttendus(ficheIds),
      this.getFinanceurs(ficheIds),
      this.getIndicateurs(ficheIds),
    ]);

    const data = fiches.map((fiche) => ({
      id: fiche.id,
      titre: fiche.titre,
      description: fiche.description,
      statut: fiche.statut,
      priorite: fiche.priorite,
      dateDebut: fiche.dateDebut,
      dateFin: fiche.dateFin,
      budgetPrevisionnel: fiche.budgetPrevisionnel
        ? Number(fiche.budgetPrevisionnel)
        : null,
      ameliorationContinue: fiche.ameliorationContinue,
      thematiques: thematiques.get(fiche.id) ?? [],
      sousThematiques: sousThematiques.get(fiche.id) ?? [],
      pilotes: pilotes.get(fiche.id) ?? [],
      structures: structures.get(fiche.id) ?? [],
      plans: plans.get(fiche.id) ?? [],
      axes: axes.get(fiche.id) ?? [],
      effetsAttendus: effetsAttendus.get(fiche.id) ?? [],
      financeurs: financeurs.get(fiche.id) ?? [],
      indicateurs: indicateurs.get(fiche.id) ?? [],
      createdAt: fiche.createdAt,
      modifiedAt: fiche.modifiedAt,
    }));

    return {
      data,
      pagination: { page, limit, count: totalCount, nbOfPages },
    };
  }

  async getFiche(collectiviteId: number, ficheId: number) {
    const db = this.databaseService.db;

    const [fiche] = await db
      .select({
        id: ficheActionTable.id,
        titre: ficheActionTable.titre,
        description: ficheActionTable.description,
        statut: ficheActionTable.statut,
        priorite: ficheActionTable.priorite,
        dateDebut: ficheActionTable.dateDebut,
        dateFin: ficheActionTable.dateFin,
        budgetPrevisionnel: ficheActionTable.budgetPrevisionnel,
        ameliorationContinue: ficheActionTable.ameliorationContinue,
        objectifs: ficheActionTable.objectifs,
        ressources: ficheActionTable.ressources,
        calendrier: ficheActionTable.calendrier,
        cibles: ficheActionTable.cibles,
        piliersEci: ficheActionTable.piliersEci,
        participationCitoyenne: ficheActionTable.participationCitoyenne,
        participationCitoyenneType: ficheActionTable.participationCitoyenneType,
        tempsDeMiseEnOeuvreId: ficheActionTable.tempsDeMiseEnOeuvre,
        restreint: ficheActionTable.restreint,
        deleted: ficheActionTable.deleted,
        createdAt: ficheActionTable.createdAt,
        modifiedAt: ficheActionTable.modifiedAt,
      })
      .from(ficheActionTable)
      .where(
        and(
          eq(ficheActionTable.id, ficheId),
          eq(ficheActionTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    // Return 404 for non-existent OR restricted fiches (don't leak existence)
    if (!fiche || fiche.restreint || fiche.deleted) {
      throw new NotFoundException(`Fiche ${ficheId} not found`);
    }

    const ficheIds = [ficheId];

    // Load all relations in parallel (summary + detail)
    const [
      thematiques,
      sousThematiques,
      pilotes,
      structures,
      plansData,
      axesData,
      effetsAttendus,
      financeurs,
      indicateurs,
      etapes,
      mesures,
      budgets,
      partenaires,
      services,
      referents,
      fichesLiees,
      tempsMiseEnOeuvre,
    ] = await Promise.all([
      this.getThematiques(ficheIds),
      this.getSousThematiques(ficheIds),
      this.getPilotes(ficheIds),
      this.getStructures(ficheIds),
      this.getPlans(ficheIds),
      this.getAxes(ficheIds),
      this.getEffetsAttendus(ficheIds),
      this.getFinanceurs(ficheIds),
      this.getIndicateurs(ficheIds),
      this.getEtapes(ficheIds),
      this.getMesures(ficheIds),
      this.getBudgets(ficheIds),
      this.getPartenaires(ficheIds),
      this.getServices(ficheIds),
      this.getReferents(ficheIds),
      this.getFichesLiees(ficheId, collectiviteId),
      fiche.tempsDeMiseEnOeuvreId
        ? this.getTempsMiseEnOeuvre(fiche.tempsDeMiseEnOeuvreId)
        : Promise.resolve(null),
    ]);

    return {
      id: fiche.id,
      titre: fiche.titre,
      description: fiche.description,
      statut: fiche.statut,
      priorite: fiche.priorite,
      dateDebut: fiche.dateDebut,
      dateFin: fiche.dateFin,
      budgetPrevisionnel: fiche.budgetPrevisionnel
        ? Number(fiche.budgetPrevisionnel)
        : null,
      ameliorationContinue: fiche.ameliorationContinue,
      thematiques: thematiques.get(ficheId) ?? [],
      sousThematiques: sousThematiques.get(ficheId) ?? [],
      pilotes: pilotes.get(ficheId) ?? [],
      structures: structures.get(ficheId) ?? [],
      plans: plansData.get(ficheId) ?? [],
      axes: axesData.get(ficheId) ?? [],
      effetsAttendus: effetsAttendus.get(ficheId) ?? [],
      financeurs: financeurs.get(ficheId) ?? [],
      indicateurs: indicateurs.get(ficheId) ?? [],
      createdAt: fiche.createdAt,
      modifiedAt: fiche.modifiedAt,
      // Detail-only fields
      objectifs: fiche.objectifs,
      ressources: fiche.ressources,
      calendrier: fiche.calendrier,
      cibles: fiche.cibles,
      piliersEci: fiche.piliersEci,
      participationCitoyenne: fiche.participationCitoyenne,
      participationCitoyenneType: fiche.participationCitoyenneType,
      tempsDeMiseEnOeuvre: tempsMiseEnOeuvre,
      etapes: etapes.get(ficheId) ?? [],
      mesures: mesures.get(ficheId) ?? [],
      budgets: budgets.get(ficheId) ?? [],
      partenaires: partenaires.get(ficheId) ?? [],
      services: services.get(ficheId) ?? [],
      referents: referents.get(ficheId) ?? [],
      fichesLiees,
    };
  }

  // --- Relation helpers returning Map<ficheId, data[]> ---

  private async getThematiques(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionThematiqueTable.ficheId,
        id: thematiqueTable.id,
        nom: thematiqueTable.nom,
      })
      .from(ficheActionThematiqueTable)
      .innerJoin(
        thematiqueTable,
        eq(thematiqueTable.id, ficheActionThematiqueTable.thematiqueId)
      )
      .where(inArray(ficheActionThematiqueTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ id: r.id, nom: r.nom }));
  }

  private async getSousThematiques(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionSousThematiqueTable.ficheId,
        id: sousThematiqueTable.id,
        nom: sousThematiqueTable.nom,
      })
      .from(ficheActionSousThematiqueTable)
      .innerJoin(
        sousThematiqueTable,
        eq(sousThematiqueTable.id, ficheActionSousThematiqueTable.thematiqueId)
      )
      .where(inArray(ficheActionSousThematiqueTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ id: r.id, nom: r.nom }));
  }

  private async getPilotes(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionPiloteTable.ficheId,
        nom: personneTagTable.nom,
      })
      .from(ficheActionPiloteTable)
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, ficheActionPiloteTable.tagId)
      )
      .where(inArray(ficheActionPiloteTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ nom: r.nom }));
  }

  private async getStructures(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionStructureTagTable.ficheId,
        id: structureTagTable.id,
        nom: structureTagTable.nom,
      })
      .from(ficheActionStructureTagTable)
      .innerJoin(
        structureTagTable,
        eq(structureTagTable.id, ficheActionStructureTagTable.structureTagId)
      )
      .where(inArray(ficheActionStructureTagTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ id: r.id, nom: r.nom }));
  }

  private async getPlans(ficheIds: number[]) {
    const db = this.databaseService.db;

    // Get all axe-to-fiche relations with their plan info
    const rows = await db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        axeId: axeTable.id,
        axeNom: axeTable.nom,
        planId: axeTable.plan,
      })
      .from(ficheActionAxeTable)
      .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
      .where(inArray(ficheActionAxeTable.ficheId, ficheIds));

    // Collect unique plan IDs to fetch their names
    const planIds = new Set<number>();
    for (const row of rows) {
      planIds.add(row.planId ?? row.axeId);
    }

    // Fetch plan names
    const planNames = new Map<number, string | null>();
    if (planIds.size > 0) {
      const planRows = await db
        .select({ id: axeTable.id, nom: axeTable.nom })
        .from(axeTable)
        .where(inArray(axeTable.id, [...planIds]));
      for (const p of planRows) {
        planNames.set(p.id, p.nom);
      }
    }

    // Deduplicate plans per fiche
    const result = new Map<number, { id: number; nom: string | null }[]>();
    for (const row of rows) {
      const ficheId = row.ficheId;
      const resolvedPlanId = row.planId ?? row.axeId;
      const list = result.get(ficheId) ?? [];
      if (!list.some((p) => p.id === resolvedPlanId)) {
        list.push({
          id: resolvedPlanId,
          nom: planNames.get(resolvedPlanId) ?? null,
        });
      }
      result.set(ficheId, list);
    }
    return result;
  }

  private async getAxes(ficheIds: number[]) {
    const db = this.databaseService.db;

    const rows = await db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        id: axeTable.id,
        nom: axeTable.nom,
        planId: axeTable.plan,
      })
      .from(ficheActionAxeTable)
      .innerJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
      .where(inArray(ficheActionAxeTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({
      id: r.id,
      nom: r.nom,
      planId: r.planId,
    }));
  }

  private async getEffetsAttendus(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionEffetAttenduTable.ficheId,
        id: effetAttenduTable.id,
        nom: effetAttenduTable.nom,
      })
      .from(ficheActionEffetAttenduTable)
      .innerJoin(
        effetAttenduTable,
        eq(effetAttenduTable.id, ficheActionEffetAttenduTable.effetAttenduId)
      )
      .where(inArray(ficheActionEffetAttenduTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ id: r.id, nom: r.nom }));
  }

  private async getFinanceurs(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionFinanceurTagTable.ficheId,
        id: financeurTagTable.id,
        nom: financeurTagTable.nom,
        montantTtc: ficheActionFinanceurTagTable.montantTtc,
      })
      .from(ficheActionFinanceurTagTable)
      .innerJoin(
        financeurTagTable,
        eq(financeurTagTable.id, ficheActionFinanceurTagTable.financeurTagId)
      )
      .where(inArray(ficheActionFinanceurTagTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({
      id: r.id,
      nom: r.nom,
      montantTtc: r.montantTtc,
    }));
  }

  private async getIndicateurs(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionIndicateurTable.ficheId,
        id: indicateurDefinitionTable.id,
        nom: indicateurDefinitionTable.titre,
        unite: indicateurDefinitionTable.unite,
      })
      .from(ficheActionIndicateurTable)
      .innerJoin(
        indicateurDefinitionTable,
        eq(
          indicateurDefinitionTable.id,
          ficheActionIndicateurTable.indicateurId
        )
      )
      .where(inArray(ficheActionIndicateurTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({
      id: r.id,
      nom: r.nom,
      unite: r.unite,
    }));
  }

  // --- Detail-only relations ---

  private async getEtapes(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionEtapeTable.ficheId,
        id: ficheActionEtapeTable.id,
        nom: ficheActionEtapeTable.nom,
        realise: ficheActionEtapeTable.realise,
        ordre: ficheActionEtapeTable.ordre,
      })
      .from(ficheActionEtapeTable)
      .where(inArray(ficheActionEtapeTable.ficheId, ficheIds))
      .orderBy(ficheActionEtapeTable.ordre);

    return this.groupByFicheId(rows, (r) => ({
      id: r.id,
      nom: r.nom,
      realise: r.realise,
      ordre: r.ordre,
    }));
  }

  private async getMesures(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionActionTable.ficheId,
        id: ficheActionActionTable.actionId,
      })
      .from(ficheActionActionTable)
      .where(inArray(ficheActionActionTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ id: r.id }));
  }

  private async getBudgets(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionBudgetTable.ficheId,
        id: ficheActionBudgetTable.id,
        type: ficheActionBudgetTable.type,
        unite: ficheActionBudgetTable.unite,
        annee: ficheActionBudgetTable.annee,
        budgetPrevisionnel: ficheActionBudgetTable.budgetPrevisionnel,
        budgetReel: ficheActionBudgetTable.budgetReel,
        estEtale: ficheActionBudgetTable.estEtale,
      })
      .from(ficheActionBudgetTable)
      .where(inArray(ficheActionBudgetTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({
      id: r.id,
      type: r.type,
      unite: r.unite,
      annee: r.annee,
      budgetPrevisionnel: r.budgetPrevisionnel,
      budgetReel: r.budgetReel,
      estEtale: r.estEtale,
    }));
  }

  private async getPartenaires(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionPartenaireTagTable.ficheId,
        id: partenaireTagTable.id,
        nom: partenaireTagTable.nom,
      })
      .from(ficheActionPartenaireTagTable)
      .innerJoin(
        partenaireTagTable,
        eq(partenaireTagTable.id, ficheActionPartenaireTagTable.partenaireTagId)
      )
      .where(inArray(ficheActionPartenaireTagTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ id: r.id, nom: r.nom }));
  }

  private async getServices(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionServiceTagTable.ficheId,
        id: serviceTagTable.id,
        nom: serviceTagTable.nom,
      })
      .from(ficheActionServiceTagTable)
      .innerJoin(
        serviceTagTable,
        eq(serviceTagTable.id, ficheActionServiceTagTable.serviceTagId)
      )
      .where(inArray(ficheActionServiceTagTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ id: r.id, nom: r.nom }));
  }

  private async getReferents(ficheIds: number[]) {
    const db = this.databaseService.db;
    const rows = await db
      .select({
        ficheId: ficheActionReferentTable.ficheId,
        nom: personneTagTable.nom,
      })
      .from(ficheActionReferentTable)
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, ficheActionReferentTable.tagId)
      )
      .where(inArray(ficheActionReferentTable.ficheId, ficheIds));

    return this.groupByFicheId(rows, (r) => ({ nom: r.nom }));
  }

  private async getFichesLiees(ficheId: number, collectiviteId: number) {
    const db = this.databaseService.db;

    const rows = await db
      .select({
        linkedFicheId: sql<number>`
          CASE
            WHEN ${ficheActionLienTable.ficheUne} = ${ficheId}
            THEN ${ficheActionLienTable.ficheDeux}
            ELSE ${ficheActionLienTable.ficheUne}
          END
        `.as('linked_fiche_id'),
      })
      .from(ficheActionLienTable)
      .where(
        or(
          eq(ficheActionLienTable.ficheUne, ficheId),
          eq(ficheActionLienTable.ficheDeux, ficheId)
        )
      );

    if (rows.length === 0) return [];

    const linkedIds = rows.map((r) => r.linkedFicheId);

    // Only return non-restricted, non-deleted linked fiches
    const linkedFiches = await db
      .select({
        id: ficheActionTable.id,
        titre: ficheActionTable.titre,
      })
      .from(ficheActionTable)
      .where(
        and(
          inArray(ficheActionTable.id, linkedIds),
          eq(ficheActionTable.collectiviteId, collectiviteId),
          eq(ficheActionTable.restreint, false),
          eq(ficheActionTable.deleted, false)
        )
      );

    return linkedFiches;
  }

  private async getTempsMiseEnOeuvre(id: number): Promise<string | null> {
    const db = this.databaseService.db;
    const [result] = await db
      .select({ nom: tempsDeMiseEnOeuvreTable.nom })
      .from(tempsDeMiseEnOeuvreTable)
      .where(eq(tempsDeMiseEnOeuvreTable.id, id))
      .limit(1);
    return result?.nom ?? null;
  }

  // --- Utility ---

  private groupByFicheId<
    T extends { ficheId: number | null },
    R,
  >(rows: T[], mapper: (row: T) => R): Map<number, R[]> {
    const map = new Map<number, R[]>();
    for (const row of rows) {
      if (row.ficheId === null) continue;
      const list = map.get(row.ficheId) ?? [];
      list.push(mapper(row));
      map.set(row.ficheId, list);
    }
    return map;
  }
}
