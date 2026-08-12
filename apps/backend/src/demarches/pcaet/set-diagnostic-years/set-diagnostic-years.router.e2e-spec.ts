import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';

describe('Années du diagnostic PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshDemarche = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
    });
    return { collectiviteId: fixture.collectivite.id, caller, demarche };
  };

  const profilOf = <T extends { code: string }>(diagnostic: { topics: T[] }) => {
    const profil = diagnostic.topics.find(
      (topic) => topic.code === 'profil_energie_climat'
    );
    if (!profil) {
      throw new Error('Le topic profil_energie_climat est absent du référentiel');
    }
    return profil;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Le choix de la collectivité remplace l’année proposée, et pour ce topic seul', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    const diagnostic = await caller.demarches.pcaet.diagnostic.setYears({
      collectiviteId,
      demarcheId: demarche.id,
      topicCode: 'profil_energie_climat',
      referenceYear: 2019,
      extraYears: [],
    });

    const profil = profilOf(diagnostic);
    expect(profil.referenceYear).toBe(2019);
    expect(profil.years).toEqual([2019, 2030, 2036, 2050]);

    // Les autres topics gardent l'année déduite de leurs propres valeurs.
    expect(
      diagnostic.topics.find((topic) => topic.code === 'enr')?.referenceYear
    ).toBe(new Date().getFullYear());
  });

  test('Une année ajoutée ouvre une colonne et persiste', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    await caller.demarches.pcaet.diagnostic.setYears({
      collectiviteId,
      demarcheId: demarche.id,
      topicCode: 'profil_energie_climat',
      referenceYear: 2021,
      extraYears: [2017, 2019],
    });

    const relu = profilOf(
      await caller.demarches.pcaet.diagnostic.get({
        collectiviteId,
        demarcheId: demarche.id,
      })
    );
    expect(relu.extraYears).toEqual([2017, 2019]);
    expect(relu.years).toEqual([2017, 2019, 2021, 2030, 2036, 2050]);
  });

  test('Une année ajoutée se retire sans toucher aux horizons', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const args = {
      collectiviteId,
      demarcheId: demarche.id,
      topicCode: 'profil_energie_climat',
      referenceYear: 2021,
    };

    await caller.demarches.pcaet.diagnostic.setYears({
      ...args,
      extraYears: [2017, 2019],
    });
    const apres = profilOf(
      await caller.demarches.pcaet.diagnostic.setYears({
        ...args,
        extraYears: [2019],
      })
    );

    expect(apres.extraYears).toEqual([2019]);
    expect(apres.years).toEqual([2019, 2021, 2030, 2036, 2050]);
  });

  test('Une année déjà affichée n’est pas retenue comme colonne ajoutée', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    // 2030 est un horizon, 2021 devient l'année de comptabilisation, et 2019 est
    // envoyée deux fois : les colonnes restent celles qu'il faut.
    const profil = profilOf(
      await caller.demarches.pcaet.diagnostic.setYears({
        collectiviteId,
        demarcheId: demarche.id,
        topicCode: 'profil_energie_climat',
        referenceYear: 2021,
        extraYears: [2030, 2021, 2019, 2019],
      })
    );

    expect(profil.extraYears).toEqual([2019]);
    expect(profil.years).toEqual([2019, 2021, 2030, 2036, 2050]);
  });

  test('Déplacer l’année de comptabilisation sur une année ajoutée la libère', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const args = {
      collectiviteId,
      demarcheId: demarche.id,
      topicCode: 'profil_energie_climat',
    };

    await caller.demarches.pcaet.diagnostic.setYears({
      ...args,
      referenceYear: 2021,
      extraYears: [2019],
    });
    const profil = profilOf(
      await caller.demarches.pcaet.diagnostic.setYears({
        ...args,
        referenceYear: 2019,
        extraYears: [2019],
      })
    );

    expect(profil.referenceYear).toBe(2019);
    expect(profil.extraYears).toEqual([]);
    expect(profil.years).toEqual([2019, 2030, 2036, 2050]);
  });

  test('Une année de comptabilisation future ou antérieure à 2010 est refusée', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    for (const referenceYear of [new Date().getFullYear() + 1, 2009]) {
      await expect(
        caller.demarches.pcaet.diagnostic.setYears({
          collectiviteId,
          demarcheId: demarche.id,
          topicCode: 'profil_energie_climat',
          referenceYear,
          extraYears: [],
        })
      ).rejects.toThrow('comptabilisation');
    }
  });

  test('Une année ajoutée hors des bornes du topic est refusée', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    // 2009 précède la borne basse, 2051 dépasse le dernier horizon du topic.
    for (const extraYear of [2009, 2051]) {
      await expect(
        caller.demarches.pcaet.diagnostic.setYears({
          collectiviteId,
          demarcheId: demarche.id,
          topicCode: 'profil_energie_climat',
          referenceYear: 2021,
          extraYears: [extraYear],
        })
      ).rejects.toThrow('comptabilisation');
    }
  });

  test('Le nombre d’années ajoutées est plafonné', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    await expect(
      caller.demarches.pcaet.diagnostic.setYears({
        collectiviteId,
        demarcheId: demarche.id,
        topicCode: 'profil_energie_climat',
        referenceYear: 2021,
        extraYears: Array.from({ length: 11 }, (_, index) => 2011 + index),
      })
    ).rejects.toThrow();
  });

  test('Un topic inconnu ou sans grille est refusé', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    for (const topicCode of ['inexistant', 'vulnerabilite_territoire']) {
      await expect(
        caller.demarches.pcaet.diagnostic.setYears({
          collectiviteId,
          demarcheId: demarche.id,
          topicCode,
          referenceYear: 2021,
          extraYears: [],
        })
      ).rejects.toThrow("Ce volet du diagnostic n'existe pas");
    }
  });

  test('Le diagnostic n’est plus modifiable dès la transmission', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    await completeTestDossierPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await caller.demarches.pcaet.applyTransition({
      collectiviteId,
      demarcheId: demarche.id,
      transition: 'transmettre_pour_avis',
    });

    await expect(
      caller.demarches.pcaet.diagnostic.setYears({
        collectiviteId,
        demarcheId: demarche.id,
        topicCode: 'profil_energie_climat',
        referenceYear: 2019,
        extraYears: [],
      })
    ).rejects.toThrow("n'est modifiable que pendant l'élaboration");
  });

  test("IDOR : la mutation n'est pas applicable via une autre collectivité", async () => {
    const { demarche } = await freshDemarche();
    const autre = await freshDemarche();

    await expect(
      autre.caller.demarches.pcaet.diagnostic.setYears({
        collectiviteId: autre.collectiviteId,
        demarcheId: demarche.id,
        topicCode: 'profil_energie_climat',
        referenceYear: 2019,
        extraYears: [],
      })
    ).rejects.toThrow("La démarche PCAET demandée n'a pas été trouvée");
  });
});
