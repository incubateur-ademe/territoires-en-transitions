import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import type { DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';

describe('Domaines de vulnérabilité ajoutés par la collectivité', () => {
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

  const vulnerabiliteOf = (diagnostic: DemarchePcaetDiagnostic) => {
    const topic = diagnostic.topics.find(
      (t) => t.code === 'vulnerabilite_territoire'
    );
    if (!topic?.vulnerabilite) {
      throw new Error('Le topic vulnerabilite_territoire est absent');
    }
    return topic.vulnerabilite;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Un domaine ajouté se range après le socle et n’est pas requis', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });

    const { domaines, lignes } = vulnerabiliteOf(diagnostic);
    expect(domaines).toHaveLength(17);
    const ajout = domaines[domaines.length - 1];
    expect(ajout).toMatchObject({
      label: 'Zones humides',
      code: null,
      requis: false,
      isSocle: false,
    });
    // Chaque domaine a sa ligne, même vierge.
    expect(lignes.some((ligne) => ligne.domaineId === ajout.id)).toBe(true);
  });

  test('Un doublon est refusé, y compris face au socle', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    await expect(
      caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'eau',
      })
    ).rejects.toThrow();

    await caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });
    await expect(
      caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'ZONES HUMIDES',
      })
    ).rejects.toThrow();
  });

  test('Renommer et supprimer ne valent que pour les domaines ajoutés', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const apresAjout =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });
    const { domaines } = vulnerabiliteOf(apresAjout);
    const ajout = domaines[domaines.length - 1];
    const socle = domaines[0];

    const renomme =
      await caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
        label: 'Zones humides et tourbières',
      });
    expect(
      vulnerabiliteOf(renomme).domaines.find((d) => d.id === ajout.id)?.label
    ).toBe('Zones humides et tourbières');

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: socle.id,
        label: 'Agriculture et pêche',
      })
    ).rejects.toThrow();

    await expect(
      caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: socle.id,
      })
    ).rejects.toThrow();

    const apresSuppression =
      await caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
      });
    expect(vulnerabiliteOf(apresSuppression).domaines).toHaveLength(16);
  });

  test('Supprimer un domaine emporte sa saisie dans toutes les démarches', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const apresAjout =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });
    const { domaines } = vulnerabiliteOf(apresAjout);
    const ajout = domaines[domaines.length - 1];

    await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
      collectiviteId,
      demarcheId: demarche.id,
      domaineId: ajout.id,
      niveau: { horizon: 'maintenant', valeur: 'fort' },
    });

    const apresSuppression =
      await caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
      });
    expect(
      vulnerabiliteOf(apresSuppression).lignes.some(
        (ligne) => ligne.domaineId === ajout.id
      )
    ).toBe(false);
  });

  test('Un domaine ajouté ne bloque jamais la transmission', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });

    const ajout = vulnerabiliteOf(diagnostic).domaines.at(-1);
    expect(ajout?.requis).toBe(false);
  });
});
