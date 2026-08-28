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
import type { PcaetDiagnostic } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { listEnabledTransitions } from '@tet/domain/utils';
import {
  attachTestPlanToDemarchePcaet,
  completeTestDiagnosticPcaet,
  completeTestDossierPcaet,
  coverTestDocumentsPcaet,
} from '../demarches-pcaet.test-fixture';
import {
  ligneOf,
  thematiqueIdOf,
  vulnerabiliteOf,
} from '../shared/demarches-pcaet-vulnerabilite.test-fixture';

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

  const thematiqueId = (diagnostic: PcaetDiagnostic, code: string): number =>
    thematiqueIdOf(diagnostic, code);

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Le socle est servi avec une ligne vierge par thématique', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    const diagnostic = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    const vulnerabilite = vulnerabiliteOf(diagnostic);
    expect(vulnerabilite.thematiques).toHaveLength(9);
    expect(vulnerabilite.thematiques.every((d) => d.isSocle && d.requis)).toBe(
      true
    );
    expect(vulnerabilite.lignes).toHaveLength(9);
    expect(ligneOf(diagnostic, thematiqueId(diagnostic, 'eau'))).toMatchObject({
      niveauMaintenant: null,
      niveau2050: null,
      niveau2100: null,
      objectifs2050: null,
    });
  });

  test('Une saisie de niveau ne touche que l’horizon visé', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const initial = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });
    const eau = thematiqueId(initial, 'eau');

    const constat =
      await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: eau,
        niveau: { horizon: 'maintenant', valeur: 'moyen' },
      });
    expect(ligneOf(constat, eau)).toMatchObject({
      niveauMaintenant: 'moyen',
      niveau2050: null,
      niveau2100: null,
    });

    const apres = await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne(
      {
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: eau,
        niveau: { horizon: '2100', valeur: 'fort' },
      }
    );
    expect(ligneOf(apres, eau)).toMatchObject({
      niveauMaintenant: 'moyen',
      niveau2050: null,
      niveau2100: 'fort',
    });
  });

  test('Un objectif vidé redevient une absence de saisie', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const initial = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });
    const foret = thematiqueId(initial, 'foret');

    const rempli =
      await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: foret,
        objectifs2050: '  Limiter les coupes rases  ',
      });
    expect(ligneOf(rempli, foret).objectifs2050).toBe(
      'Limiter les coupes rases'
    );

    const vide = await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
      collectiviteId,
      demarcheId: demarche.id,
      thematiqueId: foret,
      objectifs2050: '   ',
    });
    expect(ligneOf(vide, foret).objectifs2050).toBeNull();
  });

  test('Une thématique d’une autre collectivité n’est pas adressable', async () => {
    const premiere = await freshDemarche();
    const seconde = await freshDemarche();

    const diagnostic = await seconde.caller.demarches.pcaet.diagnostic.get({
      collectiviteId: seconde.collectiviteId,
      demarcheId: seconde.demarche.id,
    });
    const ajout =
      await seconde.caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique(
        {
          collectiviteId: seconde.collectiviteId,
          demarcheId: seconde.demarche.id,
          label: 'Zones humides',
        }
      );
    const zonesHumides = vulnerabiliteOf(ajout).thematiques.at(-1);
    expect(zonesHumides).toBeDefined();
    expect(zonesHumides?.label).toBe('Zones humides');
    expect(vulnerabiliteOf(diagnostic).thematiques).toHaveLength(9);

    await expect(
      premiere.caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId: premiere.collectiviteId,
        demarcheId: premiere.demarche.id,
        thematiqueId: zonesHumides?.id ?? 42,
        niveau: { horizon: 'maintenant', valeur: 'fort' },
      })
    ).rejects.toThrow(/n'existe pas pour la collectivité/);
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
        thematiqueId: thematiqueId(diagnostic, 'eau'),
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
        thematiqueId: thematiqueId(diagnostic, 'eau'),
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
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: thematiqueId(diagnostic, 'eau'),
        niveau: { horizon: 'maintenant', valeur: 'fort' },
      })
    ).rejects.toThrow();
  });

  test('La vulnérabilité ne conditionne pas la complétude du diagnostic', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    await attachTestPlanToDemarchePcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await coverTestDocumentsPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await completeTestDiagnosticPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });

    // Rien n'est obligatoire dans ce volet : la transmission s'ouvre sans
    // qu'une seule thématique ait été renseignée.
    const sansVulnerabilite = await caller.demarches.pcaet.get({
      collectiviteId,
      demarcheId: demarche.id,
    });
    expect(listEnabledTransitions(sansVulnerabilite.transitions)).toContain(
      'transmettre_pour_avis'
    );
  });
});
