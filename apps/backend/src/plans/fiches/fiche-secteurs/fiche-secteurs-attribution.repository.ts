import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { OrigineSecteursEnum } from '@tet/domain/plans';
import { eq, sql } from 'drizzle-orm';
import {
  FicheActionSecteurAttribution,
  ficheActionSecteurAttributionTable,
} from './fiche-action-secteur-attribution.table';

/** Version du prompt de classement de l'import IA, comme Communs date sa méthode. */
export const IMPORT_IA_METHODE = 'import_ia_v1';

export type FicheSecteursAttributionCreate =
  typeof ficheActionSecteurAttributionTable.$inferInsert;

@Injectable()
export class FicheSecteursAttributionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByFicheId(
    ficheId: number,
    tx?: Transaction
  ): Promise<FicheActionSecteurAttribution | null> {
    const [row] = await (tx ?? this.databaseService.db)
      .select()
      .from(ficheActionSecteurAttributionTable)
      .where(eq(ficheActionSecteurAttributionTable.ficheId, ficheId));
    return row ?? null;
  }

  /**
   * N'écrit que si la fiche n'a pas encore d'attribution : deux premières
   * lectures simultanées ne se gênent pas, et une saisie manuelle n'est jamais écrasée.
   */
  async createIfAbsent(
    attribution: FicheSecteursAttributionCreate,
    tx?: Transaction
  ): Promise<FicheActionSecteurAttribution | null> {
    const [inserted] = await (tx ?? this.databaseService.db)
      .insert(ficheActionSecteurAttributionTable)
      .values(attribution)
      .onConflictDoNothing({
        target: ficheActionSecteurAttributionTable.ficheId,
      })
      .returning();
    return inserted ?? this.findByFicheId(attribution.ficheId, tx);
  }

  /** Fiche tout juste créée par l'import IA : rien à préserver. */
  async createFromImportIa(
    {
      ficheId,
      secteurs,
      justification,
      modifiedBy,
    }: Pick<FicheSecteursAttributionCreate, 'ficheId' | 'secteurs'> & {
      justification: string;
      modifiedBy: string;
    },
    tx?: Transaction
  ): Promise<FicheActionSecteurAttribution | null> {
    return this.createIfAbsent(
      {
        ficheId,
        secteurs,
        origine: OrigineSecteursEnum.IMPORT_IA,
        methode: IMPORT_IA_METHODE,
        justification: justification || null,
        modifiedBy,
      },
      tx
    );
  }

  async upsertManuelle(
    {
      ficheId,
      secteurs,
      modifiedBy,
    }: Pick<FicheSecteursAttributionCreate, 'ficheId' | 'secteurs'> & {
      modifiedBy: string;
    },
    tx?: Transaction
  ): Promise<FicheActionSecteurAttribution> {
    const attribution = {
      secteurs,
      origine: OrigineSecteursEnum.MANUELLE,
      methode: null,
      reponseCommuns: null,
      justification: null,
      modifiedAt: sql`now()`,
      modifiedBy,
    };
    const [saved] = await (tx ?? this.databaseService.db)
      .insert(ficheActionSecteurAttributionTable)
      .values({ ficheId, ...attribution })
      .onConflictDoUpdate({
        target: ficheActionSecteurAttributionTable.ficheId,
        set: attribution,
      })
      .returning();
    return saved;
  }
}
