import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Collectivite } from '@tet/domain/collectivites';
import { IndicateurValeurCreate } from '@tet/domain/indicateurs';
import { and, eq, inArray } from 'drizzle-orm';
import ManageIndicateurValeursService from './manage-indicateur-valeurs.service';

describe('ManageIndicateurValeursService.replaceMetadonneeValeurs', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let service: ManageIndicateurValeursService;
  let collectivite: Collectivite;
  let otherCollectivite: Collectivite;
  let metadonneeId: number;
  let otherMetadonneeId: number;
  /** `cae_1.ca` et `cae_1.cb`, composantes du total résidentiel `cae_1.c`. */
  let ca: { id: number; precision: number };
  let cb: { id: number; precision: number };

  const valeur = (
    indicateurId: number,
    annee: number,
    objectif: number,
    overrides: Partial<IndicateurValeurCreate> = {}
  ): IndicateurValeurCreate => ({
    collectiviteId: collectivite.id,
    indicateurId,
    metadonneeId,
    dateValeur: `${annee}-01-01`,
    objectif,
    ...overrides,
  });

  const listValeurs = (metadonnee: number) =>
    database.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectivite.id),
          eq(indicateurValeurTable.metadonneeId, metadonnee),
          eq(indicateurValeurTable.calculAuto, false)
        )
      );

  beforeAll(async () => {
    app = await getTestApp();
    database = await getTestDatabase(app);
    service = app.get(ManageIndicateurValeursService);

    const created = await Promise.all([
      addTestCollectivite(database),
      addTestCollectivite(database),
    ]);
    [collectivite, otherCollectivite] = created.map((c) => c.collectivite);

    const sourceId = `test-replace-${Math.random().toString().slice(2, 10)}`;
    await database.db
      .insert(indicateurSourceTable)
      .values({ id: sourceId, libelle: sourceId });
    [{ id: metadonneeId }, { id: otherMetadonneeId }] = await database.db
      .insert(indicateurSourceMetadonneeTable)
      .values([
        { sourceId, dateVersion: '2026-01-01T00:00:00' },
        { sourceId, dateVersion: '2026-01-02T00:00:00' },
      ])
      .returning({ id: indicateurSourceMetadonneeTable.id });

    const definitions = await database.db
      .select({
        id: indicateurDefinitionTable.id,
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
        precision: indicateurDefinitionTable.precision,
      })
      .from(indicateurDefinitionTable)
      .where(
        inArray(indicateurDefinitionTable.identifiantReferentiel, [
          'cae_1.ca',
          'cae_1.cb',
        ])
      );
    const find = (identifiant: string) => {
      const found = definitions.find((d) => d.identifiant === identifiant);
      if (!found) throw new Error(`${identifiant} absent du catalogue`);
      return found;
    };
    ca = find('cae_1.ca');
    cb = find('cae_1.cb');

    return async () => {
      await Promise.all(created.map(({ cleanup }) => cleanup()));
      await database.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.sourceId, sourceId));
      await database.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, sourceId));
      await app.close();
    };
  });

  test('remplace les valeurs importées d’une métadonnée', async () => {
    // Objectif au-delà de la précision de l'indicateur : il est arrondi.
    const unit = 10 ** -ca.precision;
    const precise = 12 + unit * 0.4;

    expect(
      await service.replaceMetadonneeValeurs({
        collectiviteIds: [collectivite.id],
        metadonneeId,
        valeurs: [
          valeur(ca.id, 2030, 10),
          valeur(ca.id, 2031, precise),
          valeur(cb.id, 2030, 20),
        ],
      })
    ).toEqual({
      success: true,
      data: { created: 3, updated: 0, unchanged: 0, deleted: 0 },
    });
    // Une autre métadonnée de la même collectivité.
    await service.replaceMetadonneeValeurs({
      collectiviteIds: [collectivite.id],
      metadonneeId: otherMetadonneeId,
      valeurs: [valeur(cb.id, 2030, 99, { metadonneeId: otherMetadonneeId })],
    });
    const before = await listValeurs(metadonneeId);

    // Même valeur à l'arrondi près, `cb` absent du nouveau jeu.
    expect(
      await service.replaceMetadonneeValeurs({
        collectiviteIds: [collectivite.id],
        metadonneeId,
        valeurs: [
          valeur(ca.id, 2030, 10),
          valeur(ca.id, 2031, precise + unit * 0.05),
        ],
      })
    ).toEqual({
      success: true,
      // Le total `cae_1.c` recalculé ou supprimé n'est pas compté.
      data: { created: 0, updated: 0, unchanged: 2, deleted: 1 },
    });

    const after = await listValeurs(metadonneeId);
    expect(after.map(({ indicateurId }) => indicateurId)).toEqual([
      ca.id,
      ca.id,
    ]);
    // Les valeurs inchangées ne sont pas réécrites.
    for (const kept of after) {
      expect(kept).toEqual(before.find(({ id }) => id === kept.id));
    }

    // L'autre métadonnée n'est pas touchée.
    expect(await listValeurs(otherMetadonneeId)).toMatchObject([
      { indicateurId: cb.id, objectif: 99 },
    ]);
  });

  test('refuse une valeur hors des collectivités du remplacement', async () => {
    const before = await listValeurs(metadonneeId);
    expect(
      await service.replaceMetadonneeValeurs({
        collectiviteIds: [collectivite.id],
        metadonneeId,
        valeurs: [
          valeur(ca.id, 2030, 10),
          valeur(ca.id, 2030, 10, { collectiviteId: otherCollectivite.id }),
        ],
      })
    ).toMatchObject({ success: false, error: 'INVALID_VALUE' });
    expect(await listValeurs(metadonneeId)).toEqual(before);
  });
});
