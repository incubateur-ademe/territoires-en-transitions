import { INestApplication } from '@nestjs/common';
import {
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createDemarche } from '../demarches-pcaet.test-fixture';
import { vulnerabiliteOf } from '../shared/demarches-pcaet-vulnerabilite.test-fixture';

describe('Thematiques de vulnérabilité ajoutés par la collectivité', () => {
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

  test('Une thématique ajoutée se range après le socle et n’est pas requise', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const socle = vulnerabiliteOf(
      await caller.demarches.pcaet.diagnostic.get({
        collectiviteId,
        demarcheId: demarche.id,
      })
    ).thematiques;

    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });

    const { thematiques, lignes } = vulnerabiliteOf(diagnostic);
    expect(thematiques).toHaveLength(socle.length + 1);
    const ajout = thematiques[thematiques.length - 1];
    expect(ajout).toMatchObject({
      label: 'Zones humides',
      code: null,
      requis: false,
      isSocle: false,
    });
    // Chaque thématique a sa ligne, même vierge.
    expect(lignes.some((ligne) => ligne.thematiqueId === ajout.id)).toBe(true);
  });

  test('Un doublon est refusé, y compris face au socle', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);

    await expect(
      caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'eau',
      })
    ).rejects.toThrow();

    await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });
    await expect(
      caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'ZONES HUMIDES',
      })
    ).rejects.toThrow();
  });

  test('Renommer et supprimer ne valent que pour les thématiques ajoutées', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const apresAjout =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });
    const { thematiques } = vulnerabiliteOf(apresAjout);
    const ajout = thematiques[thematiques.length - 1];
    const socle = thematiques[0];

    const renomme =
      await caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: ajout.id,
        label: 'Zones humides et tourbières',
      });
    expect(
      vulnerabiliteOf(renomme).thematiques.find((d) => d.id === ajout.id)?.label
    ).toBe('Zones humides et tourbières');

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: socle.id,
        label: 'Agriculture et pêche',
      })
    ).rejects.toThrow();

    await expect(
      caller.demarches.pcaet.diagnostic.removeVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: socle.id,
      })
    ).rejects.toThrow();

    const apresSuppression =
      await caller.demarches.pcaet.diagnostic.removeVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: ajout.id,
      });
    expect(vulnerabiliteOf(apresSuppression).thematiques).toHaveLength(
      thematiques.length - 1
    );
  });

  test('Supprimer une thématique emporte sa saisie dans toutes les démarches', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const apresAjout =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });
    const { thematiques } = vulnerabiliteOf(apresAjout);
    const ajout = thematiques[thematiques.length - 1];

    await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
      collectiviteId,
      demarcheId: demarche.id,
      thematiqueId: ajout.id,
      niveau: { horizon: 'maintenant', valeur: 'fort' },
    });

    const apresSuppression =
      await caller.demarches.pcaet.diagnostic.removeVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: ajout.id,
      });
    expect(
      vulnerabiliteOf(apresSuppression).lignes.some(
        (ligne) => ligne.thematiqueId === ajout.id
      )
    ).toBe(false);
  });

  test('Une thématique ajoutée ne bloque jamais la transmission', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });

    const ajout = vulnerabiliteOf(diagnostic).thematiques.at(-1);
    expect(ajout?.requis).toBe(false);
  });
});

describe('Sous-thématiques de vulnérabilité', () => {
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

  /** Racine ajoutée par la collectivité, seule à pouvoir recevoir des enfants. */
  const creerRacine = async (
    caller: Awaited<ReturnType<typeof createDemarche>>['caller'],
    collectiviteId: number,
    demarcheId: number,
    label: string
  ) => {
    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId,
        label,
      });
    const racine = vulnerabiliteOf(diagnostic).thematiques.find(
      (t) => t.label === label
    );
    if (!racine) {
      throw new Error(`La racine ${label} n'a pas été servie`);
    }
    return racine;
  };

  test('Le socle sert les risques naturels sous leur thématique parente', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);

    const { thematiques } = vulnerabiliteOf(
      await caller.demarches.pcaet.diagnostic.get({
        collectiviteId,
        demarcheId: demarche.id,
      })
    );
    const parente = thematiques.find((t) => t.code === 'risques_naturels');
    expect(parente).toMatchObject({ parentId: null, isSocle: true });

    const enfants = thematiques.filter((t) => t.parentId === parente?.id);
    expect(enfants.map((t) => t.label)).toEqual([
      'Sécheresse',
      'Inondation',
      'Incendie de forêt et de végétation',
      'Submersion marine',
      'Vagues de chaleur',
      'Recul du trait de côte',
      'Retrait-gonflement des argiles',
      'Cyclones',
    ]);
  });

  test('Chaque risque naturel reçoit sa ligne, la parente comprise', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);

    const { thematiques, lignes } = vulnerabiliteOf(
      await caller.demarches.pcaet.diagnostic.get({
        collectiviteId,
        demarcheId: demarche.id,
      })
    );
    const risques = thematiques.filter(
      (t) => t.code?.startsWith('risque') ?? false
    );

    expect(risques).toHaveLength(9);
    for (const risque of risques) {
      expect(lignes.some((ligne) => ligne.thematiqueId === risque.id)).toBe(
        true
      );
    }
  });

  test('Une sous-thématique s’ajoute sous une racine de la collectivité', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const racine = await creerRacine(
      caller,
      collectiviteId,
      demarche.id,
      'Zones humides'
    );

    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Tourbières',
        parentId: racine.id,
      });

    const { thematiques, lignes } = vulnerabiliteOf(diagnostic);
    const enfant = thematiques.find((t) => t.label === 'Tourbières');
    expect(enfant).toMatchObject({ parentId: racine.id, isSocle: false });
    expect(lignes.some((ligne) => ligne.thematiqueId === enfant?.id)).toBe(true);
  });

  test('Une thématique réglementaire n’accueille pas de sous-thématique', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const { thematiques } = vulnerabiliteOf(
      await caller.demarches.pcaet.diagnostic.get({
        collectiviteId,
        demarcheId: demarche.id,
      })
    );
    const risquesNaturels = thematiques.find(
      (t) => t.code === 'risques_naturels'
    );

    await expect(
      caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Grêle',
        parentId: risquesNaturels?.id,
      })
    ).rejects.toThrow();
  });

  test('La hiérarchie s’arrête au premier sous-niveau', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const racine = await creerRacine(
      caller,
      collectiviteId,
      demarche.id,
      'Zones humides'
    );
    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Tourbières',
        parentId: racine.id,
      });
    const enfant = vulnerabiliteOf(diagnostic).thematiques.find(
      (t) => t.label === 'Tourbières'
    );

    await expect(
      caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Sphaignes',
        parentId: enfant?.id,
      })
    ).rejects.toThrow();
  });

  test('Le libellé n’est unique que dans sa fratrie', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const premiere = await creerRacine(
      caller,
      collectiviteId,
      demarche.id,
      'Zones humides'
    );
    const seconde = await creerRacine(
      caller,
      collectiviteId,
      demarche.id,
      'Zones sèches'
    );

    await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Prairies',
      parentId: premiere.id,
    });
    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Prairies',
        parentId: seconde.id,
      });

    const prairies = vulnerabiliteOf(diagnostic).thematiques.filter(
      (t) => t.label === 'Prairies'
    );
    expect(prairies.map((t) => t.parentId).sort()).toEqual(
      [premiere.id, seconde.id].sort()
    );
  });

  test('Une sœur homonyme reste refusée', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const racine = await creerRacine(
      caller,
      collectiviteId,
      demarche.id,
      'Zones humides'
    );

    await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Tourbières',
      parentId: racine.id,
    });
    await expect(
      caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'TOURBIÈRES',
        parentId: racine.id,
      })
    ).rejects.toThrow();
  });

  test('Retirer une racine emporte ses sous-thématiques', async () => {
    const { caller, collectiviteId, demarche } = await createDemarche(db, router);
    const racine = await creerRacine(
      caller,
      collectiviteId,
      demarche.id,
      'Zones humides'
    );
    const avecEnfant =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Tourbières',
        parentId: racine.id,
      });
    const enfant = vulnerabiliteOf(avecEnfant).thematiques.find(
      (t) => t.label === 'Tourbières'
    );

    const apres =
      await caller.demarches.pcaet.diagnostic.removeVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: racine.id,
      });

    const { thematiques, lignes } = vulnerabiliteOf(apres);
    expect(thematiques.some((t) => t.id === racine.id)).toBe(false);
    expect(thematiques.some((t) => t.id === enfant?.id)).toBe(false);
    expect(lignes.some((ligne) => ligne.thematiqueId === enfant?.id)).toBe(
      false
    );
  });
});
