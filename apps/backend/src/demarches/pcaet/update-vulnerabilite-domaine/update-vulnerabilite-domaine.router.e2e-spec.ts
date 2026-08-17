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
import { VULNERABILITE_DOMAINE_LABEL_MAX } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';
import {
  domaineIdOf,
  vulnerabiliteOf,
} from '../shared/demarches-pcaet-vulnerabilite.test-fixture';

describe('Renommage d’un domaine de vulnérabilité', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshDemarche = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(fixture.user),
    });
    const demarche = await caller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
    });
    return { collectiviteId: fixture.collectivite.id, caller, demarche };
  };

  const ajouterDomaine = async (
    caller: Awaited<ReturnType<typeof freshDemarche>>['caller'],
    {
      collectiviteId,
      demarcheId,
      label,
    }: { collectiviteId: number; demarcheId: number; label: string }
  ) => {
    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteDomaine({
        collectiviteId,
        demarcheId,
        label,
      });
    const domaine = vulnerabiliteOf(diagnostic).domaines.find(
      (d) => d.label === label
    );
    if (!domaine) {
      throw new Error(`Le domaine ${label} n'a pas été ajouté`);
    }
    return domaine;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Un domaine ajouté se renomme', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    const apres =
      await caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
        label: 'Zones humides et tourbières',
      });

    expect(
      vulnerabiliteOf(apres).domaines.find((d) => d.id === ajout.id)?.label
    ).toBe('Zones humides et tourbières');
  });

  test('Se renommer soi-même, à la casse près, reste permis', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    const apres =
      await caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
        label: 'ZONES HUMIDES',
      });

    expect(
      vulnerabiliteOf(apres).domaines.find((d) => d.id === ajout.id)?.label
    ).toBe('ZONES HUMIDES');
  });

  test('Heurter un autre domaine, socle compris, est refusé', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const premier = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });
    const second = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Risque incendie',
    });

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: second.id,
        label: 'zones humides',
      })
    ).rejects.toThrow();

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: premier.id,
        label: 'Eau',
      })
    ).rejects.toThrow();
  });

  test('Un domaine du socle ne se renomme pas', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const diagnostic = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: domaineIdOf(diagnostic, 'eau'),
        label: 'Eau et assainissement',
      })
    ).rejects.toThrow();
  });

  test('Un libellé trop long est refusé', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
        label: 'a'.repeat(VULNERABILITE_DOMAINE_LABEL_MAX + 1),
      })
    ).rejects.toThrow();
  });

  test('Un domaine d’une autre collectivité est refusé', async () => {
    const premiere = await freshDemarche();
    const seconde = await freshDemarche();
    const ajout = await ajouterDomaine(seconde.caller, {
      collectiviteId: seconde.collectiviteId,
      demarcheId: seconde.demarche.id,
      label: 'Zones humides',
    });

    await expect(
      premiere.caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId: premiere.collectiviteId,
        demarcheId: premiere.demarche.id,
        domaineId: ajout.id,
        label: 'Autre nom',
      })
    ).rejects.toThrow();
  });

  test('La démarche d’une autre collectivité reste introuvable', async () => {
    const premiere = await freshDemarche();
    const seconde = await freshDemarche();
    const ajout = await ajouterDomaine(premiere.caller, {
      collectiviteId: premiere.collectiviteId,
      demarcheId: premiere.demarche.id,
      label: 'Zones humides',
    });

    await expect(
      premiere.caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId: premiere.collectiviteId,
        demarcheId: seconde.demarche.id,
        domaineId: ajout.id,
        label: 'Autre nom',
      })
    ).rejects.toThrow();
  });

  test('Un lecteur ne peut pas renommer', async () => {
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
    const ajout = await ajouterDomaine(editeur, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    await expect(
      lecteur.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
        label: 'Autre nom',
      })
    ).rejects.toThrow();
  });

  test('Le renommage est fermé une fois le dossier transmis', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
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
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
        label: 'Autre nom',
      })
    ).rejects.toThrow();
  });
});
