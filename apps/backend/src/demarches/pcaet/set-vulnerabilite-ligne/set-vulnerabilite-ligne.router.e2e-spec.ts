import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUser,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import type { DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';

describe('Vulnérabilité du territoire', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshDemarche = async (role = CollectiviteRole.EDITION) => {
    const fixture = await addTestCollectiviteAndUser(db, { user: { role } });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
    });
    return { collectiviteId: fixture.collectivite.id, caller, demarche };
  };

  const vulnerabiliteOf = (diagnostic: DemarchePcaetDiagnostic) => {
    const topic = diagnostic.topics.find(
      (t) => t.code === 'vulnerabilite_territoire'
    );
    if (!topic?.vulnerabilite) {
      throw new Error('Le topic vulnerabilite_territoire est absent');
    }
    return topic.vulnerabilite;
  };

  const domaineId = (
    diagnostic: DemarchePcaetDiagnostic,
    code: string
  ): number => {
    const domaine = vulnerabiliteOf(diagnostic).domaines.find(
      (d) => d.code === code
    );
    if (!domaine) {
      throw new Error(`Le domaine ${code} est absent du socle`);
    }
    return domaine.id;
  };

  const ligneOf = (diagnostic: DemarchePcaetDiagnostic, id: number) => {
    const ligne = vulnerabiliteOf(diagnostic).lignes.find(
      (l) => l.domaineId === id
    );
    if (!ligne) {
      throw new Error(`Le domaine ${id} n'a pas de ligne`);
    }
    return ligne;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Le socle est servi avec une ligne vierge par domaine', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    const diagnostic = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    const vulnerabilite = vulnerabiliteOf(diagnostic);
    expect(vulnerabilite.domaines).toHaveLength(16);
    expect(vulnerabilite.domaines.every((d) => d.isSocle && d.requis)).toBe(
      true
    );
    expect(vulnerabilite.lignes).toHaveLength(16);
    expect(ligneOf(diagnostic, domaineId(diagnostic, 'eau'))).toMatchObject({
      niveauMaintenant: null,
      niveau2050: null,
      niveau2100: null,
      objectifs2050: null,
    });
  });

  test('Poser le constat actuel pré-remplit les horizons vides, sans écraser une correction', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const initial = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });
    const eau = domaineId(initial, 'eau');

    const cascade =
      await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: eau,
        niveau: { horizon: 'maintenant', valeur: 'moyen' },
      });
    expect(ligneOf(cascade, eau)).toMatchObject({
      niveauMaintenant: 'moyen',
      niveau2050: 'moyen',
      niveau2100: 'moyen',
    });

    await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
      collectiviteId,
      demarcheId: demarche.id,
      domaineId: eau,
      niveau: { horizon: '2100', valeur: 'fort' },
    });
    const apres =
      await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: eau,
        niveau: { horizon: 'maintenant', valeur: 'faible' },
      });

    expect(ligneOf(apres, eau)).toMatchObject({
      niveauMaintenant: 'faible',
      niveau2050: 'moyen',
      niveau2100: 'fort',
    });
  });

  test('Un objectif vidé redevient une absence de saisie', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const initial = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });
    const foret = domaineId(initial, 'foret');

    const rempli =
      await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: foret,
        objectifs2050: '  Limiter les coupes rases  ',
      });
    expect(ligneOf(rempli, foret).objectifs2050).toBe(
      'Limiter les coupes rases'
    );

    const vide = await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
      collectiviteId,
      demarcheId: demarche.id,
      domaineId: foret,
      objectifs2050: '   ',
    });
    expect(ligneOf(vide, foret).objectifs2050).toBeNull();
  });

  test('Un domaine d’une autre collectivité n’est pas adressable', async () => {
    const premiere = await freshDemarche();
    const seconde = await freshDemarche();

    const diagnostic = await seconde.caller.demarches.pcaet.diagnostic.get({
      collectiviteId: seconde.collectiviteId,
      demarcheId: seconde.demarche.id,
    });
    const ajout =
      await seconde.caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
        collectiviteId: seconde.collectiviteId,
        demarcheId: seconde.demarche.id,
        label: 'Zones humides',
      });
    const zonesHumides = vulnerabiliteOf(ajout).domaines.at(-1);
    expect(zonesHumides?.label).toBe('Zones humides');
    expect(vulnerabiliteOf(diagnostic).domaines).toHaveLength(16);

    await expect(
      premiere.caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId: premiere.collectiviteId,
        demarcheId: premiere.demarche.id,
        domaineId: zonesHumides?.id ?? 0,
        niveau: { horizon: 'maintenant', valeur: 'fort' },
      })
    ).rejects.toThrow();
  });

  test('La démarche d’une autre collectivité reste introuvable', async () => {
    const premiere = await freshDemarche();
    const seconde = await freshDemarche();
    const diagnostic = await premiere.caller.demarches.pcaet.diagnostic.get({
      collectiviteId: premiere.collectiviteId,
      demarcheId: premiere.demarche.id,
    });

    await expect(
      premiere.caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId: premiere.collectiviteId,
        demarcheId: seconde.demarche.id,
        domaineId: domaineId(diagnostic, 'eau'),
        niveau: { horizon: 'maintenant', valeur: 'fort' },
      })
    ).rejects.toThrow();
  });

  test('Un lecteur ne peut pas saisir', async () => {
    const fixture = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.LECTURE },
      ],
    });
    const collectiviteId = fixture.collectivite.id;
    const [editeur, lecteur] = fixture.users.map((user) =>
      router.createCaller({ user: getAuthUserFromUserCredentials(user) })
    );
    const demarche = await editeur.demarches.pcaet.create({ collectiviteId });
    const diagnostic = await editeur.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      lecteur.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: domaineId(diagnostic, 'eau'),
        niveau: { horizon: 'maintenant', valeur: 'fort' },
      })
    ).rejects.toThrow();
  });

  test('Le diagnostic n’est plus modifiable une fois le dossier transmis', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const diagnostic = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });
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
      caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: domaineId(diagnostic, 'eau'),
        niveau: { horizon: 'maintenant', valeur: 'fort' },
      })
    ).rejects.toThrow();
  });

});
