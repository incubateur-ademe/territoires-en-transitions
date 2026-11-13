import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { addTestDepotSupraVoisin } from '../demarches-pcaet.test-fixture';

describe('Les collectivités qu’un service peut chercher dans sa liste', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  it('suggère le Supra et ses EPCI couverts, rattachés à lui', async () => {
    const { dreal, drealCaller, supra, epciChezLaDreal, epciChezLeSupra } =
      await addTestDepotSupraVoisin({ db, router });

    const { collectivites, departements, regions } =
      await drealCaller.demarches.pcaet.listCollectivitesSuivies({
        collectiviteId: dreal.collectivite.id,
      });

    const porteur = { id: supra.id, nom: supra.nom };
    expect(collectivites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: supra.id, isSupra: true, porteur: null }),
        expect.objectContaining({ id: epciChezLaDreal.id, porteur }),
        expect.objectContaining({ id: epciChezLeSupra.id, porteur }),
      ])
    );
    expect(regions.map(({ code }) => code)).toEqual([
      dreal.collectivite.regionCode,
    ]);
    // Rangés par code, une fois chacun.
    const codes = departements.map(({ code }) => code);
    expect(codes).toEqual([...new Set(codes)].sort());
  });

  it('refuse l’agent d’un autre service', async () => {
    const { dreal } = await addTestDepotSupraVoisin({ db, router });
    const autre = await addTestDepotSupraVoisin({ db, router });

    await expect(
      autre.drealCaller.demarches.pcaet.listCollectivitesSuivies({
        collectiviteId: dreal.collectivite.id,
      })
    ).rejects.toThrow();
  });
});
