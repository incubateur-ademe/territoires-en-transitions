import { Injectable } from '@nestjs/common';
import { annexeTable } from '@tet/backend/collectivites/documents/models/annexe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ActionImpactStatutCategorie,
  PanierCheckout,
  PanierCheckoutLine,
  PanierCheckoutLineLien,
} from '@tet/domain/plans';
import { and, eq, inArray } from 'drizzle-orm';
import { groupBy } from 'es-toolkit';
import { z } from 'zod';
import { actionImpactActionTable } from '../models/action-impact-action.table';
import { actionImpactEffetAttenduTable } from '../models/action-impact-effet-attendu.table';
import { actionImpactFourchetteBudgetaireTable } from '../models/action-impact-fourchette-budgetaire.table';
import { actionImpactIndicateurTable } from '../models/action-impact-indicateur.table';
import { actionImpactPanierTable } from '../models/action-impact-panier.table';
import { actionImpactPartenaireTable } from '../models/action-impact-partenaire.table';
import { actionImpactSousThematiqueTable } from '../models/action-impact-sous-thematique.table';
import { actionImpactStatutTable } from '../models/action-impact-statut.table';
import { actionImpactThematiqueTable } from '../models/action-impact-thematique.table';
import { actionImpactTable } from '../models/action-impact.table';
import { panierPartenaireTable } from '../models/panier-partenaire.table';
import { panierTable } from '../models/panier.table';

type ActionImpactRow = {
  id: number;
  titre: string;
  description: string;
  descriptionComplementaire: string;
  fourchetteBudgetaireNom: string | null;
  rex: unknown;
  ressourcesExternes: unknown;
};

const isActionImpactStatutCategorie = (
  value: string
): value is ActionImpactStatutCategorie =>
  value === 'en_cours' || value === 'realise';

const lienSchema = z.object({ url: z.string(), label: z.string() });

const parseLiens = (value: unknown): PanierCheckoutLineLien[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const result = lienSchema.safeParse(entry);
    return result.success
      ? [{ url: result.data.url, titre: result.data.label }]
      : [];
  });
};

@Injectable()
export class PanierCheckoutRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getPanierCheckout(
    panierId: string,
    tx?: Transaction
  ): Promise<Result<PanierCheckout, 'PANIER_NOT_FOUND'>> {
    const db = tx ?? this.databaseService.db;

    const [panier] = await db
      .select({
        id: panierTable.id,
        collectiviteId: panierTable.collectiviteId,
      })
      .from(panierTable)
      .where(eq(panierTable.id, panierId))
      .limit(1);

    if (!panier) {
      return failure('PANIER_NOT_FOUND');
    }
    const proprietaireCollectiviteId = panier.collectiviteId;

    const actionRows: ActionImpactRow[] = await db
      .select({
        id: actionImpactTable.id,
        titre: actionImpactTable.titre,
        description: actionImpactTable.description,
        descriptionComplementaire: actionImpactTable.descriptionComplementaire,
        fourchetteBudgetaireNom: actionImpactFourchetteBudgetaireTable.nom,
        rex: actionImpactTable.rex,
        ressourcesExternes: actionImpactTable.ressourcesExternes,
      })
      .from(actionImpactPanierTable)
      .innerJoin(
        actionImpactTable,
        eq(actionImpactPanierTable.actionId, actionImpactTable.id)
      )
      .leftJoin(
        actionImpactFourchetteBudgetaireTable,
        eq(
          actionImpactTable.fourchetteBudgetaire,
          actionImpactFourchetteBudgetaireTable.niveau
        )
      )
      .where(eq(actionImpactPanierTable.panierId, panierId));

    if (actionRows.length === 0) {
      return success({ proprietaireCollectiviteId, lines: [] });
    }

    const actionIds = actionRows.map((row) => row.id);

    const [
      statutRows,
      thematiqueRows,
      sousThematiqueRows,
      indicateurRows,
      effetAttenduRows,
      mesureRows,
      partenaireRows,
    ] = await Promise.all([
      db
        .select({
          actionId: actionImpactStatutTable.actionId,
          categorieId: actionImpactStatutTable.categorieId,
        })
        .from(actionImpactStatutTable)
        .where(
          and(
            eq(actionImpactStatutTable.panierId, panierId),
            inArray(actionImpactStatutTable.actionId, actionIds)
          )
        ),
      db
        .select({
          actionImpactId: actionImpactThematiqueTable.actionImpactId,
          thematiqueId: actionImpactThematiqueTable.thematiqueId,
        })
        .from(actionImpactThematiqueTable)
        .where(inArray(actionImpactThematiqueTable.actionImpactId, actionIds)),
      db
        .select({
          actionImpactId: actionImpactSousThematiqueTable.actionImpactId,
          sousThematiqueId: actionImpactSousThematiqueTable.sousThematiqueId,
        })
        .from(actionImpactSousThematiqueTable)
        .where(
          inArray(actionImpactSousThematiqueTable.actionImpactId, actionIds)
        ),
      db
        .select({
          actionImpactId: actionImpactIndicateurTable.actionImpactId,
          indicateurId: actionImpactIndicateurTable.indicateurId,
        })
        .from(actionImpactIndicateurTable)
        .where(inArray(actionImpactIndicateurTable.actionImpactId, actionIds)),
      db
        .select({
          actionImpactId: actionImpactEffetAttenduTable.actionImpactId,
          effetAttenduId: actionImpactEffetAttenduTable.effetAttenduId,
        })
        .from(actionImpactEffetAttenduTable)
        .where(
          inArray(actionImpactEffetAttenduTable.actionImpactId, actionIds)
        ),
      db
        .select({
          actionImpactId: actionImpactActionTable.actionImpactId,
          actionId: actionImpactActionTable.actionId,
        })
        .from(actionImpactActionTable)
        .where(inArray(actionImpactActionTable.actionImpactId, actionIds)),
      db
        .select({
          actionImpactId: actionImpactPartenaireTable.actionImpactId,
          nom: panierPartenaireTable.nom,
        })
        .from(actionImpactPartenaireTable)
        .innerJoin(
          panierPartenaireTable,
          eq(actionImpactPartenaireTable.partenaireId, panierPartenaireTable.id)
        )
        .where(inArray(actionImpactPartenaireTable.actionImpactId, actionIds)),
    ]);

    const statutByActionId = new Map(
      statutRows.flatMap((row) =>
        isActionImpactStatutCategorie(row.categorieId)
          ? [[row.actionId, row.categorieId] as const]
          : []
      )
    );
    const thematiquesByActionId = groupBy(
      thematiqueRows,
      (r) => r.actionImpactId
    );
    const sousThematiquesByActionId = groupBy(
      sousThematiqueRows,
      (r) => r.actionImpactId
    );
    const indicateursByActionId = groupBy(
      indicateurRows,
      (r) => r.actionImpactId
    );
    const effetsAttendusByActionId = groupBy(
      effetAttenduRows,
      (r) => r.actionImpactId
    );
    const mesuresByActionId = groupBy(mesureRows, (r) => r.actionImpactId);
    const partenairesByActionId = groupBy(
      partenaireRows,
      (r) => r.actionImpactId
    );

    const lines: PanierCheckoutLine[] = actionRows.map((row) => ({
      sourceActionImpactId: row.id,
      titre: row.titre,
      description: row.description,
      descriptionComplementaire: row.descriptionComplementaire,
      statut: statutByActionId.get(row.id) ?? null,
      fourchetteBudgetaireNom: row.fourchetteBudgetaireNom,
      thematiqueIds: (thematiquesByActionId[row.id] ?? []).map(
        (r) => r.thematiqueId
      ),
      sousThematiqueIds: (sousThematiquesByActionId[row.id] ?? []).map(
        (r) => r.sousThematiqueId
      ),
      indicateurIds: (indicateursByActionId[row.id] ?? []).map(
        (r) => r.indicateurId
      ),
      effetAttenduIds: (effetsAttendusByActionId[row.id] ?? []).map(
        (r) => r.effetAttenduId
      ),
      mesureIds: (mesuresByActionId[row.id] ?? []).map((r) => r.actionId),
      partenaireNoms: (partenairesByActionId[row.id] ?? []).map((r) => r.nom),
      liensExternes: [
        ...parseLiens(row.rex),
        ...parseLiens(row.ressourcesExternes),
      ],
    }));

    return success({ proprietaireCollectiviteId, lines });
  }

  async removeActionsFromPanier(
    panierId: string,
    actionIds: number[],
    tx?: Transaction
  ): Promise<void> {
    if (actionIds.length === 0) return;
    const db = tx ?? this.databaseService.db;
    await db
      .delete(actionImpactPanierTable)
      .where(
        and(
          eq(actionImpactPanierTable.panierId, panierId),
          inArray(actionImpactPanierTable.actionId, actionIds)
        )
      );
  }

  async insertAnnexesForFiche(
    {
      ficheId,
      collectiviteId,
      liensExternes,
      userId,
    }: {
      ficheId: number;
      collectiviteId: number;
      liensExternes: PanierCheckoutLineLien[];
      userId: string;
    },
    tx?: Transaction
  ): Promise<void> {
    if (liensExternes.length === 0) return;
    const db = tx ?? this.databaseService.db;
    await db.insert(annexeTable).values(
      liensExternes.map((lien) => ({
        collectiviteId,
        ficheId,
        url: lien.url,
        titre: lien.titre,
        fichierId: null,
        modifiedBy: userId,
      }))
    );
  }
}
