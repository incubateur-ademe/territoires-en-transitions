import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { IndicateurSourceEnum } from '@tet/domain/indicateurs';
import { and, asc, eq, inArray, isNotNull, or, sql } from 'drizzle-orm';

/**
 * Libellé de la source et nom des données : le front n'affiche que « SNBC3 ».
 * La version et le commit importés sont dans le bucket de l'import
 * (`manifest.json`, `last-import.json`).
 */
const SNBC3_SOURCE_LIBELLE = 'SNBC3';

export type Snbc3MetadonneeVersion = {
  /** Date de publication de la release `snbc3` importée. */
  dateVersion: string;
};

const getMetadonneeContent = ({ dateVersion }: Snbc3MetadonneeVersion) => ({
  dateVersion,
  nomDonnees: SNBC3_SOURCE_LIBELLE,
  diffuseur: 'ADEME',
  producteur: 'ADEME',
  methodologie: null,
  limites: null,
});

/**
 * Source `snbc3` et son unique métadonnée (ADR 0023, §2) : chaque import met à
 * jour la même métadonnée, ce qui conserve les identifiants des valeurs.
 *
 * Mêmes conventions que la métadonnée SNBC 2 : diffuseur et producteur ADEME,
 * pas de limites. La méthodologie attend une page d'aide dédiée à la SNBC 3.
 */
@Injectable()
export class Snbc3SourceMetadonneeRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Métadonnée `snbc3`, créée avec cette date si elle n'existe pas encore.
   * Une métadonnée existante n'est pas modifiée : un import complet ne change
   * sa date qu'une fois ses valeurs remplacées (`updateMetadonnee`).
   */
  async findOrCreateMetadonnee(
    { dateVersion }: Snbc3MetadonneeVersion,
    tx?: Transaction
  ): Promise<number> {
    const db = tx ?? this.databaseService.db;

    // Juste après la SNBC 2 : même ordre, départagé par le libellé.
    const [snbc] = await db
      .select({ ordreAffichage: indicateurSourceTable.ordreAffichage })
      .from(indicateurSourceTable)
      .where(eq(indicateurSourceTable.id, IndicateurSourceEnum.SNBC));
    await db
      .insert(indicateurSourceTable)
      .values({
        id: IndicateurSourceEnum.SNBC3,
        libelle: SNBC3_SOURCE_LIBELLE,
        ordreAffichage: snbc?.ordreAffichage ?? null,
      })
      .onConflictDoUpdate({
        target: indicateurSourceTable.id,
        set: { libelle: SNBC3_SOURCE_LIBELLE },
      });

    const existingId = await this.findMetadonneeId(tx);
    if (existingId !== null) return existingId;
    const [created] = await db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId: IndicateurSourceEnum.SNBC3,
        ...getMetadonneeContent({ dateVersion }),
      })
      .returning({ id: indicateurSourceMetadonneeTable.id });
    return created.id;
  }

  async updateMetadonnee(
    metadonneeId: number,
    { dateVersion }: Snbc3MetadonneeVersion,
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .update(indicateurSourceMetadonneeTable)
      .set(getMetadonneeContent({ dateVersion }))
      .where(eq(indicateurSourceMetadonneeTable.id, metadonneeId));
  }

  async upsertMetadonnee(
    version: Snbc3MetadonneeVersion,
    tx?: Transaction
  ): Promise<number> {
    const metadonneeId = await this.findOrCreateMetadonnee(version, tx);
    await this.updateMetadonnee(metadonneeId, version, tx);
    return metadonneeId;
  }

  async findMetadonneeId(tx?: Transaction): Promise<number | null> {
    const [metadonnee] = await (tx ?? this.databaseService.db)
      .select({ id: indicateurSourceMetadonneeTable.id })
      .from(indicateurSourceMetadonneeTable)
      .where(
        eq(indicateurSourceMetadonneeTable.sourceId, IndicateurSourceEnum.SNBC3)
      )
      .orderBy(asc(indicateurSourceMetadonneeTable.id))
      .limit(1);
    return metadonnee?.id ?? null;
  }

  /** Collectivités rattachables, par SIREN ou par code commune. */
  listCollectivites({
    sirens,
    communeCodes,
  }: {
    sirens: string[];
    communeCodes: string[];
  }) {
    return this.databaseService.db
      .select({
        id: collectiviteTable.id,
        siren: collectiviteTable.siren,
        communeCode: collectiviteTable.communeCode,
      })
      .from(collectiviteTable)
      .where(
        or(
          sirens.length ? inArray(collectiviteTable.siren, sirens) : undefined,
          communeCodes.length
            ? and(
                inArray(collectiviteTable.communeCode, communeCodes),
                eq(collectiviteTable.type, 'commune')
              )
            : undefined
        )
      );
  }

  async getIndicateurIds(identifiants: readonly string[]) {
    const definitions = await this.databaseService.db
      .select({
        id: indicateurDefinitionTable.id,
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
      })
      .from(indicateurDefinitionTable)
      .where(
        inArray(indicateurDefinitionTable.identifiantReferentiel, [
          ...identifiants,
        ])
      );
    return new Map(
      definitions.flatMap(({ id, identifiant }) =>
        identifiant ? [[identifiant, id] as const] : []
      )
    );
  }

  /** Collectivités qui ont au moins une valeur de la métadonnée. */
  async listCollectiviteIdsWithValeurs(metadonneeId: number) {
    return (await this.listCollectivitesWithValeurs(metadonneeId)).map(
      ({ collectiviteId }) => collectiviteId
    );
  }

  /**
   * Collectivités qui ont au moins une valeur de la métadonnée, avec le nombre
   * de leurs valeurs importées (hors totaux calculés).
   */
  async listCollectivitesWithValeurs(metadonneeId: number) {
    return this.databaseService.db
      .select({
        collectiviteId: indicateurValeurTable.collectiviteId,
        importedCount:
          sql<number>`count(*) filter (where ${indicateurValeurTable.calculAuto} = false)`.mapWith(
            Number
          ),
      })
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.metadonneeId, metadonneeId),
          isNotNull(indicateurValeurTable.collectiviteId)
        )
      )
      .groupBy(indicateurValeurTable.collectiviteId);
  }

  /**
   * EPCI à fiscalité propre et EPT de TeT, pour signaler ceux qui n'ont pas de
   * trajectoire.
   */
  listEpciIds() {
    return this.databaseService.db
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable)
      .where(
        and(
          eq(collectiviteTable.type, 'epci'),
          inArray(collectiviteTable.natureInsee, [
            'CC',
            'CA',
            'CU',
            'METRO',
            'EPT',
          ])
        )
      )
      .then((rows) => rows.map(({ id }) => id));
  }
}
