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
import { VULNERABILITE_THEMATIQUE_LABEL_MAX } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';
import {
  thematiqueIdOf,
  vulnerabiliteOf,
} from '../shared/demarches-pcaet-vulnerabilite.test-fixture';

describe('Renommage d’une thématique de vulnérabilité', () => {
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

  const ajouterThematique = async (
    caller: Awaited<ReturnType<typeof freshDemarche>>['caller'],
    {
      collectiviteId,
      demarcheId,
      label,
    }: { collectiviteId: number; demarcheId: number; label: string }
  ) => {
    const diagnostic =
      await caller.demarches.pcaet.diagnostic.addVulnerabiliteThematique({
        collectiviteId,
        demarcheId,
        label,
      });
    const thematique = vulnerabiliteOf(diagnostic).thematiques.find(
      (d) => d.label === label
    );
    if (!thematique) {
      throw new Error(`La thématique ${label} n'a pas été ajoutée`);
    }
    return thematique;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Une thématique ajoutée se renomme', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterThematique(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    const apres =
      await caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: ajout.id,
        label: 'Zones humides et tourbières',
      });

    expect(
      vulnerabiliteOf(apres).thematiques.find((d) => d.id === ajout.id)?.label
    ).toBe('Zones humides et tourbières');
  });

  test('Se renommer soi-même, à la casse près, reste permis', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterThematique(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    const apres =
      await caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: ajout.id,
        label: 'ZONES HUMIDES',
      });

    expect(
      vulnerabiliteOf(apres).thematiques.find((d) => d.id === ajout.id)?.label
    ).toBe('ZONES HUMIDES');
  });

  test('Heurter une autre thématique, socle compris, est refusé', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const premier = await ajouterThematique(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });
    const second = await ajouterThematique(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Risque incendie',
    });

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: second.id,
        label: 'zones humides',
      })
    ).rejects.toThrow();

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: premier.id,
        label: 'Eau',
      })
    ).rejects.toThrow();
  });

  test('Une thématique du socle ne se renomme pas', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const diagnostic = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: thematiqueIdOf(diagnostic, 'eau'),
        label: 'Eau et assainissement',
      })
    ).rejects.toThrow();
  });

  test('Un libellé trop long est refusé', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterThematique(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    await expect(
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: ajout.id,
        label: 'a'.repeat(VULNERABILITE_THEMATIQUE_LABEL_MAX + 1),
      })
    ).rejects.toThrow();
  });

  test('Une thématique d’une autre collectivité est refusée', async () => {
    const premiere = await freshDemarche();
    const seconde = await freshDemarche();
    const ajout = await ajouterThematique(seconde.caller, {
      collectiviteId: seconde.collectiviteId,
      demarcheId: seconde.demarche.id,
      label: 'Zones humides',
    });

    await expect(
      premiere.caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId: premiere.collectiviteId,
        demarcheId: premiere.demarche.id,
        thematiqueId: ajout.id,
        label: 'Autre nom',
      })
    ).rejects.toThrow();
  });

  test('La démarche d’une autre collectivité reste introuvable', async () => {
    const premiere = await freshDemarche();
    const seconde = await freshDemarche();
    const ajout = await ajouterThematique(premiere.caller, {
      collectiviteId: premiere.collectiviteId,
      demarcheId: premiere.demarche.id,
      label: 'Zones humides',
    });

    await expect(
      premiere.caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId: premiere.collectiviteId,
        demarcheId: seconde.demarche.id,
        thematiqueId: ajout.id,
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
    const ajout = await ajouterThematique(editeur, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    await expect(
      lecteur.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: ajout.id,
        label: 'Autre nom',
      })
    ).rejects.toThrow();
  });

  test('Le renommage est fermé une fois le dossier transmis', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterThematique(caller, {
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
      caller.demarches.pcaet.diagnostic.updateVulnerabiliteThematique({
        collectiviteId,
        demarcheId: demarche.id,
        thematiqueId: ajout.id,
        label: 'Autre nom',
      })
    ).rejects.toThrow();
  });
});
