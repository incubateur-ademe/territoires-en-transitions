import { INestApplication } from '@nestjs/common';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { getIndicateurIdByIdentifiant } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { IndicateurSourceEnum } from '@tet/domain/indicateurs';
import { and, asc, eq } from 'drizzle-orm';
import { vi } from 'vitest';

/**
 * En test, les flags PostHog sont toujours actifs pour un utilisateur
 * authentifié. Force la valeur du flag SNBC 3 ; les autres flags gardent leur
 * comportement. L'app de test est partagée par les fichiers d'un même worker :
 * appeler la fonction renvoyée pour rétablir le flag.
 */
export function mockTrajectoireSnbc3Flag(
  app: INestApplication,
  enabled: boolean
): () => void {
  const trackingService = app.get(TrackingService);
  const isFeatureEnabled =
    trackingService.isFeatureEnabled.bind(trackingService);
  const spy = vi
    .spyOn(trackingService, 'isFeatureEnabled')
    .mockImplementation(async (feature, ...args) =>
      feature === 'is-trajectoire-snbc3-enabled'
        ? enabled
        : isFeatureEnabled(feature, ...args)
    );
  return () => spy.mockRestore();
}

/** L'unique métadonnée `snbc3`, créée si aucun import n'a encore eu lieu. */
async function getOrCreateSnbc3MetadonneeId(database: DatabaseService) {
  await database.db
    .insert(indicateurSourceTable)
    .values({ id: IndicateurSourceEnum.SNBC3, libelle: 'SNBC3' })
    .onConflictDoNothing();
  const [existing] = await database.db
    .select({ id: indicateurSourceMetadonneeTable.id })
    .from(indicateurSourceMetadonneeTable)
    .where(
      eq(indicateurSourceMetadonneeTable.sourceId, IndicateurSourceEnum.SNBC3)
    )
    .orderBy(asc(indicateurSourceMetadonneeTable.id))
    .limit(1);
  if (existing) {
    return existing.id;
  }
  const [created] = await database.db
    .insert(indicateurSourceMetadonneeTable)
    .values({
      sourceId: IndicateurSourceEnum.SNBC3,
      dateVersion: '2026-11-02T00:00:00',
      nomDonnees: 'SNBC3',
      diffuseur: 'ADEME',
      producteur: 'ADEME',
    })
    .returning({ id: indicateurSourceMetadonneeTable.id });
  return created.id;
}

/**
 * Valeurs `snbc3` d'une collectivité, écrites comme l'import : objectifs
 * annuels, sans commentaire de sources (le chemin SNBC 3 ne le lit pas).
 */
export async function addTestTrajectoireSnbc3Valeurs(
  database: DatabaseService,
  collectiviteId: number,
  valeurs: { identifiant: string; annee: number; objectif: number }[]
) {
  const metadonneeId = await getOrCreateSnbc3MetadonneeId(database);
  const indicateurIds = new Map<string, number>();
  for (const { identifiant } of valeurs) {
    if (!indicateurIds.has(identifiant)) {
      indicateurIds.set(
        identifiant,
        await getIndicateurIdByIdentifiant(database, identifiant)
      );
    }
  }
  await database.db.insert(indicateurValeurTable).values(
    valeurs.map(({ identifiant, annee, objectif }) => ({
      collectiviteId,
      indicateurId: indicateurIds.get(identifiant) as number,
      periodicite: 'annuelle' as const,
      dateValeur: `${annee}-01-01`,
      metadonneeId,
      objectif,
      objectifCommentaire: 'Trajectoire SNBC 3 recalée sur OREC 2021',
    }))
  );

  return {
    metadonneeId,
    cleanup: () =>
      database.db
        .delete(indicateurValeurTable)
        .where(
          and(
            eq(indicateurValeurTable.collectiviteId, collectiviteId),
            eq(indicateurValeurTable.metadonneeId, metadonneeId)
          )
        ),
  };
}
