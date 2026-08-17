import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  DemarchePcaetVulnerabiliteHorizonEnum,
  type DemarchePcaetVulnerabiliteDomaine,
  type DemarchePcaetVulnerabiliteHorizon,
  type DemarchePcaetVulnerabiliteLigne,
  type DemarchePcaetVulnerabiliteNiveau,
} from '@tet/domain/demarches';
import { and, asc, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { demarchePcaetVulnerabiliteDomaineTable } from './models/demarche-pcaet-vulnerabilite-domaine.table';
import { demarchePcaetVulnerabiliteValeurTable } from './models/demarche-pcaet-vulnerabilite-valeur.table';

/** Domaine tel qu'il est stocké, avant projection vers le domaine métier. */
type DomaineRow = {
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

/** Premier rang laissé aux domaines ajoutés, le socle occupant la plage basse. */
const DISPLAY_ORDER_AJOUTS_MIN = 1000;

const VALEUR_TABLE = 'demarche_pcaet_vulnerabilite_valeur';

/** Colonne SQL portant le niveau d'un horizon. */
const NIVEAU_COLONNES = {
  [DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT]: 'niveau_maintenant',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2050]: 'niveau_2050',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2100]: 'niveau_2100',
} as const satisfies Record<DemarchePcaetVulnerabiliteHorizon, string>;

/** Horizons alimentés par une saisie, dans l'ordre chronologique. */
const HORIZONS_SUIVANTS = {
  [DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT]: [
    DemarchePcaetVulnerabiliteHorizonEnum.H2050,
    DemarchePcaetVulnerabiliteHorizonEnum.H2100,
  ],
  [DemarchePcaetVulnerabiliteHorizonEnum.H2050]: [
    DemarchePcaetVulnerabiliteHorizonEnum.H2100,
  ],
  [DemarchePcaetVulnerabiliteHorizonEnum.H2100]: [],
} as const satisfies Record<
  DemarchePcaetVulnerabiliteHorizon,
  readonly DemarchePcaetVulnerabiliteHorizon[]
>;

const ligneColumns = {
  domaineId: demarchePcaetVulnerabiliteValeurTable.domaineId,
  niveauMaintenant: demarchePcaetVulnerabiliteValeurTable.niveauMaintenant,
  niveau2050: demarchePcaetVulnerabiliteValeurTable.niveau2050,
  niveau2100: demarchePcaetVulnerabiliteValeurTable.niveau2100,
  objectifs2050: demarchePcaetVulnerabiliteValeurTable.objectifs2050,
  objectifs2100: demarchePcaetVulnerabiliteValeurTable.objectifs2100,
};

const domaineColumns = {
  id: demarchePcaetVulnerabiliteDomaineTable.id,
  code: demarchePcaetVulnerabiliteDomaineTable.code,
  label: demarchePcaetVulnerabiliteDomaineTable.label,
  collectiviteId: demarchePcaetVulnerabiliteDomaineTable.collectiviteId,
  requis: demarchePcaetVulnerabiliteDomaineTable.requis,
};

/**
 * La ligne de `demarche_pcaet_vulnerabilite_valeur` fait office de rattachement
 * du domaine à la démarche : elle est créée vierge à l'ouverture du dépôt, et
 * la supprimer retire le domaine de cette démarche seulement.
 */
@Injectable()
export class DemarchePcaetVulnerabiliteRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Domaines affichés par une démarche : le socle, toujours, plus les domaines
   * de la collectivité qui lui sont rattachés. Le socle est joint par union
   * plutôt que par rattachement pour qu'un domaine réglementaire ajouté par une
   * migration ultérieure apparaisse sur les dépôts en cours, sans reprise.
   */
  async listDomainesDeLaDemarche(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteDomaine[]> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select(domaineColumns)
      .from(demarchePcaetVulnerabiliteDomaineTable)
      .where(
        and(
          this.appartientA(collectiviteId),
          or(
            isNull(demarchePcaetVulnerabiliteDomaineTable.collectiviteId),
            sql`exists (
              select 1 from ${demarchePcaetVulnerabiliteValeurTable} v
               where v.domaine_id = ${demarchePcaetVulnerabiliteDomaineTable.id}
                 and v.demarche_id = ${demarcheId}
            )`
          )
        )
      )
      .orderBy(
        asc(demarchePcaetVulnerabiliteDomaineTable.displayOrder),
        asc(demarchePcaetVulnerabiliteDomaineTable.id)
      );

    return rows.map(toDomaine);
  }

  /** Saisie de la démarche, une entrée par domaine rattaché. */
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

  /** Le domaine existe et la collectivité y a accès (socle ou ajout à elle). */
  async findDomaine(
    {
      domaineId,
      collectiviteId,
    }: { domaineId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteDomaine | undefined> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select(domaineColumns)
      .from(demarchePcaetVulnerabiliteDomaineTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteDomaineTable.id, domaineId),
          this.appartientA(collectiviteId)
        )
      )
      .limit(1);

    const row = rows[0];
    return row === undefined ? undefined : toDomaine(row);
  }

  /**
   * Domaine accessible portant ce libellé, à la casse près. La comparaison est
   * faite par Postgres (`lower`), la même que celle de l'index d'unicité : une
   * comparaison JS dépendrait de la locale du process et divergerait.
   */
  async findDomaineByLabel(
    { collectiviteId, label }: { collectiviteId: number; label: string },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteDomaine | undefined> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select(domaineColumns)
      .from(demarchePcaetVulnerabiliteDomaineTable)
      .where(
        and(
          this.appartientA(collectiviteId),
          sql`lower(${demarchePcaetVulnerabiliteDomaineTable.label}) = lower(${label})`
        )
      )
      .limit(1);

    const row = rows[0];
    return row === undefined ? undefined : toDomaine(row);
  }

  async isDomaineRattache(
    { demarcheId, domaineId }: { demarcheId: number; domaineId: number },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select({ domaineId: demarchePcaetVulnerabiliteValeurTable.domaineId })
      .from(demarchePcaetVulnerabiliteValeurTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteValeurTable.demarcheId, demarcheId),
          eq(demarchePcaetVulnerabiliteValeurTable.domaineId, domaineId)
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  /**
   * Rattache d'un bloc tous les domaines accessibles à la collectivité. Appelé
   * à l'ouverture du dépôt : la démarche part avec la palette complète, et le
   * détachement devient l'opération qui retire une ligne du tableau.
   */
  async attachDomainesAccessibles(
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
          (demarche_id, domaine_id, created_by, modified_by)
      select ${demarcheId}, d.id, ${userId}::uuid, ${userId}::uuid
        from ${demarchePcaetVulnerabiliteDomaineTable} d
       where d.collectivite_id is null or d.collectivite_id = ${collectiviteId}
      on conflict (demarche_id, domaine_id) do nothing
    `);
  }

  /** Rattache un domaine à une démarche. Sans effet s'il l'est déjà. */
  async attachDomaine(
    {
      demarcheId,
      domaineId,
      userId,
    }: { demarcheId: number; domaineId: number; userId: string },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .insert(demarchePcaetVulnerabiliteValeurTable)
      .values({ demarcheId, domaineId, createdBy: userId, modifiedBy: userId })
      .onConflictDoNothing();
  }

  /** Retire le domaine de cette démarche, et d'elle seule. */
  async detachDomaine(
    { demarcheId, domaineId }: { demarcheId: number; domaineId: number },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .delete(demarchePcaetVulnerabiliteValeurTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteValeurTable.demarcheId, demarcheId),
          eq(demarchePcaetVulnerabiliteValeurTable.domaineId, domaineId)
        )
      );
  }

  /** Nombre de démarches, autres que celle-ci, où le domaine est rattaché. */
  async countAutresDemarchesRattachees(
    { demarcheId, domaineId }: { demarcheId: number; domaineId: number },
    tx?: Transaction
  ): Promise<number> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(demarchePcaetVulnerabiliteValeurTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteValeurTable.domaineId, domaineId),
          ne(demarchePcaetVulnerabiliteValeurTable.demarcheId, demarcheId)
        )
      );
    return row?.total ?? 0;
  }

  /**
   * Écrit un patch de cellule en une seule instruction. Le pré-remplissage des
   * horizons plus lointains est exprimé par un `coalesce` sur la valeur en
   * base : la règle « ne remplit que ce qui est vide » s'applique donc au sein
   * de l'écriture, sans lecture préalable qu'une saisie concurrente pourrait
   * périmer. Transcription SQL d'`applyNiveauCascade`, dont le spec du domaine
   * reste la référence.
   */
  async patchLigne(
    {
      demarcheId,
      domaineId,
      patch,
      userId,
    }: {
      demarcheId: number;
      domaineId: number;
      patch: VulnerabiliteLignePatch;
      userId: string;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;

    const insertValues: Record<string, unknown> = {
      demarcheId,
      domaineId,
      createdBy: userId,
      modifiedBy: userId,
    };
    const set: Record<string, unknown> = {
      modifiedBy: userId,
      modifiedAt: sql`now()`,
    };

    const excluded = (colonne: string) =>
      sql`excluded.${sql.identifier(colonne)}`;
    const conserveSiRenseigne = (colonne: string) =>
      sql`coalesce(${sql.identifier(VALEUR_TABLE)}.${sql.identifier(
        colonne
      )}, excluded.${sql.identifier(colonne)})`;

    if (patch.niveau) {
      const { horizon, valeur } = patch.niveau;
      insertValues[NIVEAU_CHAMPS[horizon]] = valeur;
      set[NIVEAU_CHAMPS[horizon]] = excluded(NIVEAU_COLONNES[horizon]);

      // Retirer une saisie ne propage rien : seul l'horizon visé est effacé.
      if (valeur !== null) {
        for (const suivant of HORIZONS_SUIVANTS[horizon]) {
          insertValues[NIVEAU_CHAMPS[suivant]] = valeur;
          set[NIVEAU_CHAMPS[suivant]] = conserveSiRenseigne(
            NIVEAU_COLONNES[suivant]
          );
        }
      }
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
          demarchePcaetVulnerabiliteValeurTable.domaineId,
        ],
        set,
      });
  }

  /**
   * Ajoute un domaine au catalogue de la collectivité. Le rang se place
   * derrière les ajouts existants, sans jamais remonter dans la plage du socle.
   */
  async insertDomaine(
    {
      collectiviteId,
      label,
      userId,
    }: { collectiviteId: number; label: string; userId: string },
    tx?: Transaction
  ): Promise<DemarchePcaetVulnerabiliteDomaine> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .insert(demarchePcaetVulnerabiliteDomaineTable)
      .values({
        code: null,
        label,
        collectiviteId,
        // Un domaine ajouté ne conditionne jamais la transmission : le socle
        // est ce que le cadre de dépôt exige, pas ce que la collectivité ajoute.
        requis: false,
        displayOrder: sql<number>`(
          select greatest(coalesce(max(d.display_order), 0) + 1, ${DISPLAY_ORDER_AJOUTS_MIN})
            from ${demarchePcaetVulnerabiliteDomaineTable} d
           where d.collectivite_id = ${collectiviteId}
        )`,
        createdBy: userId,
        modifiedBy: userId,
      })
      .returning(domaineColumns);

    return toDomaine(row);
  }

  async updateDomaineLabel(
    {
      domaineId,
      collectiviteId,
      label,
      userId,
    }: {
      domaineId: number;
      collectiviteId: number;
      label: string;
      userId: string;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .update(demarchePcaetVulnerabiliteDomaineTable)
      .set({ label, modifiedBy: userId, modifiedAt: new Date().toISOString() })
      .where(
        and(
          eq(demarchePcaetVulnerabiliteDomaineTable.id, domaineId),
          eq(
            demarchePcaetVulnerabiliteDomaineTable.collectiviteId,
            collectiviteId
          )
        )
      );
  }

  /**
   * Supprime l'entrée de catalogue. Réservée au domaine que plus aucune
   * démarche ne rattache : sans quoi le détachement suffit.
   */
  async deleteDomaine(
    {
      domaineId,
      collectiviteId,
    }: { domaineId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .delete(demarchePcaetVulnerabiliteDomaineTable)
      .where(
        and(
          eq(demarchePcaetVulnerabiliteDomaineTable.id, domaineId),
          eq(
            demarchePcaetVulnerabiliteDomaineTable.collectiviteId,
            collectiviteId
          )
        )
      );
  }

  private appartientA(collectiviteId: number) {
    return or(
      isNull(demarchePcaetVulnerabiliteDomaineTable.collectiviteId),
      eq(demarchePcaetVulnerabiliteDomaineTable.collectiviteId, collectiviteId)
    );
  }
}

/** Champ Drizzle portant le niveau d'un horizon. */
const NIVEAU_CHAMPS = {
  [DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT]: 'niveauMaintenant',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2050]: 'niveau2050',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2100]: 'niveau2100',
} as const satisfies Record<DemarchePcaetVulnerabiliteHorizon, string>;

const toDomaine = (row: DomaineRow): DemarchePcaetVulnerabiliteDomaine => ({
  id: row.id,
  code: row.code,
  label: row.label,
  requis: row.requis,
  isSocle: row.collectiviteId === null,
});
