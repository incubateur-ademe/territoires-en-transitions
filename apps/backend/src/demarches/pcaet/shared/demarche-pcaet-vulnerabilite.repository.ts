import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  DemarchePcaetVulnerabiliteHorizonEnum,
  type DemarchePcaetVulnerabiliteThematique,
  type DemarchePcaetVulnerabiliteHorizon,
  type DemarchePcaetVulnerabiliteLigne,
  type DemarchePcaetVulnerabiliteNiveau,
} from '@tet/domain/demarches';
import { and, asc, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { demarchePcaetVulnerabiliteThematiqueTable } from './models/demarche-pcaet-vulnerabilite-thematique.table';
import { demarchePcaetVulnerabiliteValeurTable } from './models/demarche-pcaet-vulnerabilite-valeur.table';

/** Thématique telle qu'elle est stockée, avant projection vers la thématique métier. */
type ThematiqueRow = {
  id: number;
  code: string | null;
  label: string;
  collectiviteId: number | null;
  requis: boolean;
};

/** Patch d'une ligne : seules les clés présentes sont écrites. */
export type VulnerabiliteLignePatch = {
  niveau?: {
    horizon: DemarchePcaetVulnerabiliteHorizon;
    valeur: DemarchePcaetVulnerabiliteNiveau | null;
  };
  objectifs2050?: string | null;
  objectifs2100?: string | null;
};

/** Premier rang laissé aux thématiques ajoutées, le socle occupant la plage basse. */
const DISPLAY_ORDER_AJOUTS_MIN = 1000;

/** Colonne SQL portant le niveau d'un horizon. */
const NIVEAU_COLONNES = {
  [DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT]: 'niveau_maintenant',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2050]: 'niveau_2050',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2100]: 'niveau_2100',
} as const satisfies Record<DemarchePcaetVulnerabiliteHorizon, string>;

const ligneColumns = {
  thematiqueId: demarchePcaetVulnerabiliteValeurTable.thematiqueId,
  niveauMaintenant: demarchePcaetVulnerabiliteValeurTable.niveauMaintenant,
  niveau2050: demarchePcaetVulnerabiliteValeurTable.niveau2050,
  niveau2100: demarchePcaetVulnerabiliteValeurTable.niveau2100,
  objectifs2050: demarchePcaetVulnerabiliteValeurTable.objectifs2050,
  objectifs2100: demarchePcaetVulnerabiliteValeurTable.objectifs2100,
};

const thematiqueColumns = {
  id: demarchePcaetVulnerabiliteThematiqueTable.id,
  code: demarchePcaetVulnerabiliteThematiqueTable.code,
  label: demarchePcaetVulnerabiliteThematiqueTable.label,
  collectiviteId: demarchePcaetVulnerabiliteThematiqueTable.collectiviteId,
  requis: demarchePcaetVulnerabiliteThematiqueTable.requis,
};

/**
 * La ligne de `demarche_pcaet_vulnerabilite_valeur` fait office de rattachement
 * de la thématique à la démarche : elle est créée vierge à l'ouverture du dépôt, et
 * la supprimer retire la thématique de cette démarche seulement.
 */
@Injectable()
export class DemarchePcaetVulnerabiliteRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Thématiques affichées par une démarche : le socle, toujours, plus les
   * thématiques de la collectivité qui lui sont rattachées. Le socle est joint par union
   * plutôt que par rattachement pour qu'une thématique réglementaire ajoutée par une
   * migration ultérieure apparaisse sur les dépôts en cours, sans reprise.
   */
  async listThematiquesDeLaDemarche(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteThematique[]> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select(thematiqueColumns)
      .from(demarchePcaetVulnerabiliteThematiqueTable)
      .where(
        and(
          this.appartientA(collectiviteId),
          or(
            isNull(demarchePcaetVulnerabiliteThematiqueTable.collectiviteId),
            sql`exists (
              select 1 from ${demarchePcaetVulnerabiliteValeurTable} v
               where v.thematique_id = ${demarchePcaetVulnerabiliteThematiqueTable.id}
                 and v.demarche_id = ${demarcheId}
            )`
          )
        )
      )
      .orderBy(
        asc(demarchePcaetVulnerabiliteThematiqueTable.displayOrder),
        asc(demarchePcaetVulnerabiliteThematiqueTable.id)
      );

    return rows.map(toThematique);
  }

  /** Saisie de la démarche, une entrée par thématique rattachée. */
  async listLignes(
    demarcheId: number,
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteLigne[]> {
    const db = tx ?? this.databaseService.db;
    return db
      .select(ligneColumns)
      .from(demarchePcaetVulnerabiliteValeurTable)
      .where(eq(demarchePcaetVulnerabiliteValeurTable.demarcheId, demarcheId));
  }

  /** La thématique existe et la collectivité y a accès (socle ou ajout à elle). */
  async findThematique(
    {
      thematiqueId,
      collectiviteId,
    }: { thematiqueId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteThematique | undefined> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select(thematiqueColumns)
      .from(demarchePcaetVulnerabiliteThematiqueTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteThematiqueTable.id, thematiqueId),
          this.appartientA(collectiviteId)
        )
      )
      .limit(1);

    const row = rows[0];
    return row === undefined ? undefined : toThematique(row);
  }

  /**
   * Thématique accessible portant ce libellé, à la casse près. La comparaison est
   * faite par Postgres (`lower`), la même que celle de l'index d'unicité : une
   * comparaison JS dépendrait de la locale du process et divergerait.
   */
  async findThematiqueByLabel(
    { collectiviteId, label }: { collectiviteId: number; label: string },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteThematique | undefined> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select(thematiqueColumns)
      .from(demarchePcaetVulnerabiliteThematiqueTable)
      .where(
        and(
          this.appartientA(collectiviteId),
          sql`lower(${demarchePcaetVulnerabiliteThematiqueTable.label}) = lower(${label})`
        )
      )
      .limit(1);

    const row = rows[0];
    return row === undefined ? undefined : toThematique(row);
  }

  async isThematiqueRattache(
    { demarcheId, thematiqueId }: { demarcheId: number; thematiqueId: number },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select({
        thematiqueId: demarchePcaetVulnerabiliteValeurTable.thematiqueId,
      })
      .from(demarchePcaetVulnerabiliteValeurTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteValeurTable.demarcheId, demarcheId),
          eq(demarchePcaetVulnerabiliteValeurTable.thematiqueId, thematiqueId)
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  /**
   * Rattache d'un bloc toutes les thématiques accessibles à la collectivité. Appelé
   * à l'ouverture du dépôt : la démarche part avec la palette complète, et le
   * détachement devient l'opération qui retire une ligne du tableau.
   */
  async attachThematiquesAccessibles(
    {
      demarcheId,
      collectiviteId,
      userId,
    }: { demarcheId: number; collectiviteId: number; userId: string },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db.execute(sql`
      insert into ${demarchePcaetVulnerabiliteValeurTable}
          (demarche_id, thematique_id, created_by, modified_by)
      select ${demarcheId}, d.id, ${userId}::uuid, ${userId}::uuid
        from ${demarchePcaetVulnerabiliteThematiqueTable} d
       where d.collectivite_id is null or d.collectivite_id = ${collectiviteId}
      on conflict (demarche_id, thematique_id) do nothing
    `);
  }

  /** Rattache une thématique à une démarche. Sans effet si elle l'est déjà. */
  async attachThematique(
    {
      demarcheId,
      thematiqueId,
      userId,
    }: { demarcheId: number; thematiqueId: number; userId: string },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .insert(demarchePcaetVulnerabiliteValeurTable)
      .values({
        demarcheId,
        thematiqueId,
        createdBy: userId,
        modifiedBy: userId,
      })
      .onConflictDoNothing();
  }

  /** Retire la thématique de cette démarche, et d'elle seule. */
  async detachThematique(
    { demarcheId, thematiqueId }: { demarcheId: number; thematiqueId: number },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .delete(demarchePcaetVulnerabiliteValeurTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteValeurTable.demarcheId, demarcheId),
          eq(demarchePcaetVulnerabiliteValeurTable.thematiqueId, thematiqueId)
        )
      );
  }

  /** Nombre de démarches, autres que celle-ci, où la thématique est rattachée. */
  async countAutresDemarchesRattachees(
    { demarcheId, thematiqueId }: { demarcheId: number; thematiqueId: number },
    tx?: Transaction
  ): Promise<number> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(demarchePcaetVulnerabiliteValeurTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteValeurTable.thematiqueId, thematiqueId),
          ne(demarchePcaetVulnerabiliteValeurTable.demarcheId, demarcheId)
        )
      );
    return row?.total ?? 0;
  }

  /**
   * Écrit un patch de cellule en une seule instruction : seul l'horizon visé
   * change, une saisie n'en déduit jamais les autres.
   */
  async patchLigne(
    {
      demarcheId,
      thematiqueId,
      patch,
      userId,
    }: {
      demarcheId: number;
      thematiqueId: number;
      patch: VulnerabiliteLignePatch;
      userId: string;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;

    const insertValues: Record<string, unknown> = {
      demarcheId,
      thematiqueId,
      createdBy: userId,
      modifiedBy: userId,
    };
    const set: Record<string, unknown> = {
      modifiedBy: userId,
      modifiedAt: sql`now()`,
    };

    const excluded = (colonne: string) =>
      sql`excluded.${sql.identifier(colonne)}`;

    if (patch.niveau) {
      const { horizon, valeur } = patch.niveau;
      insertValues[NIVEAU_CHAMPS[horizon]] = valeur;
      set[NIVEAU_CHAMPS[horizon]] = excluded(NIVEAU_COLONNES[horizon]);
    }

    if (patch.objectifs2050 !== undefined) {
      insertValues.objectifs2050 = patch.objectifs2050;
      set.objectifs2050 = excluded('objectifs_2050');
    }
    if (patch.objectifs2100 !== undefined) {
      insertValues.objectifs2100 = patch.objectifs2100;
      set.objectifs2100 = excluded('objectifs_2100');
    }

    await db
      .insert(demarchePcaetVulnerabiliteValeurTable)
      .values(
        insertValues as typeof demarchePcaetVulnerabiliteValeurTable.$inferInsert
      )
      .onConflictDoUpdate({
        target: [
          demarchePcaetVulnerabiliteValeurTable.demarcheId,
          demarchePcaetVulnerabiliteValeurTable.thematiqueId,
        ],
        set,
      });
  }

  /**
   * Ajoute une thématique au catalogue de la collectivité. Le rang se place
   * derrière les ajouts existants, sans jamais remonter dans la plage du socle.
   */
  async insertThematique(
    {
      collectiviteId,
      label,
      userId,
    }: { collectiviteId: number; label: string; userId: string },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteThematique> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .insert(demarchePcaetVulnerabiliteThematiqueTable)
      .values({
        code: null,
        label,
        collectiviteId,
        // Une thématique ajoutée ne conditionne jamais la transmission : le socle
        // est ce que le cadre de dépôt exige, pas ce que la collectivité ajoute.
        requis: false,
        displayOrder: sql<number>`(
          select greatest(coalesce(max(d.display_order), 0) + 1, ${DISPLAY_ORDER_AJOUTS_MIN})
            from ${demarchePcaetVulnerabiliteThematiqueTable} d
           where d.collectivite_id = ${collectiviteId}
        )`,
        createdBy: userId,
        modifiedBy: userId,
      })
      .returning(thematiqueColumns);

    return toThematique(row);
  }

  async updateThematiqueLabel(
    {
      thematiqueId,
      collectiviteId,
      label,
      userId,
    }: {
      thematiqueId: number;
      collectiviteId: number;
      label: string;
      userId: string;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .update(demarchePcaetVulnerabiliteThematiqueTable)
      .set({ label, modifiedBy: userId, modifiedAt: new Date().toISOString() })
      .where(
        and(
          eq(demarchePcaetVulnerabiliteThematiqueTable.id, thematiqueId),
          eq(
            demarchePcaetVulnerabiliteThematiqueTable.collectiviteId,
            collectiviteId
          )
        )
      );
  }

  /**
   * Supprime l'entrée de catalogue. Réservée à la thématique que plus aucune
   * démarche ne rattache : sans quoi le détachement suffit.
   */
  async deleteThematique(
    {
      thematiqueId,
      collectiviteId,
    }: { thematiqueId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .delete(demarchePcaetVulnerabiliteThematiqueTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteThematiqueTable.id, thematiqueId),
          eq(
            demarchePcaetVulnerabiliteThematiqueTable.collectiviteId,
            collectiviteId
          )
        )
      );
  }

  private appartientA(collectiviteId: number) {
    return or(
      isNull(demarchePcaetVulnerabiliteThematiqueTable.collectiviteId),
      eq(
        demarchePcaetVulnerabiliteThematiqueTable.collectiviteId,
        collectiviteId
      )
    );
  }
}

/** Champ Drizzle portant le niveau d'un horizon. */
const NIVEAU_CHAMPS = {
  [DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT]: 'niveauMaintenant',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2050]: 'niveau2050',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2100]: 'niveau2100',
} as const satisfies Record<DemarchePcaetVulnerabiliteHorizon, string>;

const toThematique = (
  row: ThematiqueRow
): DemarchePcaetVulnerabiliteThematique => ({
  id: row.id,
  code: row.code,
  label: row.label,
  requis: row.requis,
  isSocle: row.collectiviteId === null,
});
