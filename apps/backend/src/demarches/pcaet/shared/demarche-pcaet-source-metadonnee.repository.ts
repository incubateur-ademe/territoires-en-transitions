import { Injectable } from '@nestjs/common';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq } from 'drizzle-orm';
import { demarchePcaetSourceMetadonneeTable } from './models/demarche-pcaet-source-metadonnee.table';

/**
 * Source interne dédiée au dépôt PCAET : les valeurs saisies dans le
 * diagnostic portent une métadonnée, ce qui les distingue des saisies
 * ordinaires de la collectivité sur les mêmes indicateurs.
 */
export const PCAET_COLLECTIVITE_SOURCE_ID = 'pcaet-collectivite';
const PCAET_COLLECTIVITE_SOURCE_LABEL = 'PCAET collectivité';

/**
 * Chaque couple (démarche, collectivité) a sa propre
 * `indicateur_source_metadonnee` : c'est elle qui isole les valeurs de deux
 * PCAET d'une même collectivité, même s'ils partagent le même `source_id`.
 */
@Injectable()
export class DemarchePcaetSourceMetadonneeRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findMetadonneeId(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<number | null> {
    const [link] = await (tx ?? this.databaseService.db)
      .select({ metadonneeId: demarchePcaetSourceMetadonneeTable.metadonneeId })
      .from(demarchePcaetSourceMetadonneeTable)
      .where(
        and(
          eq(demarchePcaetSourceMetadonneeTable.demarcheId, demarcheId),
          eq(demarchePcaetSourceMetadonneeTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    return link?.metadonneeId ?? null;
  }

  /** Crée la métadonnée à la volée : elle ne dépend que du couple (démarche, collectivité). */
  async getOrCreateMetadonneeId(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<number> {
    const existing = await this.findMetadonneeId(
      { demarcheId, collectiviteId },
      tx
    );
    if (existing !== null) {
      return existing;
    }

    const db = tx ?? this.databaseService.db;

    // La source PCAET est upsertée pour que
    // `indicateur_source_metadonnee.source_id` soit toujours resolvable.
    await db
      .insert(indicateurSourceTable)
      .values({
        id: PCAET_COLLECTIVITE_SOURCE_ID,
        libelle: PCAET_COLLECTIVITE_SOURCE_LABEL,
        ordreAffichage: null,
      })
      .onConflictDoUpdate({
        target: indicateurSourceTable.id,
        set: { libelle: PCAET_COLLECTIVITE_SOURCE_LABEL },
      });

    const [metadonnee] = await db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId: PCAET_COLLECTIVITE_SOURCE_ID,
        dateVersion: new Date().toISOString(),
        nomDonnees: null,
        diffuseur: null,
        producteur: null,
        methodologie: null,
        limites: null,
      })
      .returning({ id: indicateurSourceMetadonneeTable.id });

    await db
      .insert(demarchePcaetSourceMetadonneeTable)
      .values({
        demarcheId,
        collectiviteId,
        metadonneeId: metadonnee.id,
      })
      .onConflictDoNothing();

    // Course entre deux premières saisies concurrentes : le lien déjà posé
    // gagne, la métadonnée créée pour rien reste orpheline.
    return (
      (await this.findMetadonneeId({ demarcheId, collectiviteId }, tx)) ??
      metadonnee.id
    );
  }
}
