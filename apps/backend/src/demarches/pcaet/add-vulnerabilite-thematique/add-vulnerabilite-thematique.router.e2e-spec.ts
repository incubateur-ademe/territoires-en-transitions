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
import { vulnerabiliteOf } from '../shared/demarches-pcaet-vulnerabilite.test-fixture';

describe('Thematiques de vulnérabilité ajoutés par la collectivité', () => {
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

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Une thématique ajoutée se range après le socle et n’est pas requise', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();

    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        label: 'Zones humides',
      });

    const { thematiques, lignes } = vulnerabiliteOf(diagnostic);
    expect(thematiques).toHaveLength(10);
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
    const { caller, collectiviteId, demarche } = await freshDemarche();

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
    const { caller, collectiviteId, demarche } = await freshDemarche();
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
    expect(vulnerabiliteOf(apresSuppression).thematiques).toHaveLength(9);
  });

  test('Supprimer une thématique emporte sa saisie dans toutes les démarches', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
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
    const { caller, collectiviteId, demarche } = await freshDemarche();
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
