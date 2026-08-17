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
import { CollectiviteRole } from '@tet/domain/users';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { eq } from 'drizzle-orm';
import { completeTestDossierPcaet } from '../demarches-pcaet.test-fixture';
import {
  domaineIdOf,
  vulnerabiliteOf,
} from '../shared/demarches-pcaet-vulnerabilite.test-fixture';

describe('Retrait d’un domaine de vulnérabilité', () => {
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

  /** Fait passer le délai d'avis pour pouvoir adopter la démarche. */
  const backdateTransmission = async (demarcheId: number) => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Retirer un domaine que cette démarche seule utilise le supprime du catalogue', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });

    const apres =
      await caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
      });

    expect(vulnerabiliteOf(apres).domaines).toHaveLength(16);
    // Le catalogue est purgé : le libellé redevient disponible à l'ajout.
    const reajout = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });
    expect(reajout.id).not.toBe(ajout.id);
  });

  test('Retirer un domaine utilisé par une autre démarche ne touche que celle-ci', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const ajout = await ajouterDomaine(caller, {
      collectiviteId,
      demarcheId: demarche.id,
      label: 'Zones humides',
    });
    await caller.demarches.pcaet.diagnostic.setVulnerabiliteLigne({
      collectiviteId,
      demarcheId: demarche.id,
      domaineId: ajout.id,
      niveau: { horizon: 'maintenant', valeur: 'fort' },
    });

    // Une seconde démarche n'est possible qu'une fois la première adoptée :
    // l'index d'unicité couvre l'élaboration et la transmission.
    await completeTestDossierPcaet(db, {
      collectiviteId,
      demarcheId: demarche.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId,
      demarcheId: demarche.id,
    });
    await backdateTransmission(demarche.id);
    await caller.demarches.pcaet.adopter({
      collectiviteId,
      demarcheId: demarche.id,
    });
    const seconde = await caller.demarches.pcaet.create({ collectiviteId });

    // La seconde démarche hérite du catalogue de la collectivité à sa création.
    const diagnosticSeconde = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: seconde.id,
    });
    expect(
      vulnerabiliteOf(diagnosticSeconde).domaines.some((d) => d.id === ajout.id)
    ).toBe(true);

    await caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
      collectiviteId,
      demarcheId: seconde.id,
      domaineId: ajout.id,
    });

    // La photo de la première démarche est intacte, saisie comprise.
    const photo = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });
    const lignePremiere = vulnerabiliteOf(photo).lignes.find(
      (l) => l.domaineId === ajout.id
    );
    expect(lignePremiere?.niveauMaintenant).toBe('fort');
  });

  test('Un domaine du socle ne se retire pas', async () => {
    const { caller, collectiviteId, demarche } = await freshDemarche();
    const diagnostic = await caller.demarches.pcaet.diagnostic.get({
      collectiviteId,
      demarcheId: demarche.id,
    });

    await expect(
      caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: domaineIdOf(diagnostic, 'eau'),
      })
    ).rejects.toThrow();
  });

  test('Un domaine inconnu ou d’une autre collectivité est refusé', async () => {
    const premiere = await freshDemarche();
    const seconde = await freshDemarche();
    const ajout = await ajouterDomaine(seconde.caller, {
      collectiviteId: seconde.collectiviteId,
      demarcheId: seconde.demarche.id,
      label: 'Zones humides',
    });

    await expect(
      premiere.caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId: premiere.collectiviteId,
        demarcheId: premiere.demarche.id,
        domaineId: ajout.id,
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
      premiere.caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId: premiere.collectiviteId,
        demarcheId: seconde.demarche.id,
        domaineId: ajout.id,
      })
    ).rejects.toThrow();
  });

  test('Un lecteur ne peut pas retirer de domaine', async () => {
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
      lecteur.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
      })
    ).rejects.toThrow();
  });

  test('Le retrait est fermé une fois le dossier transmis', async () => {
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
      caller.demarches.pcaet.diagnostic.removeVulnerabiliteDomaine({
        collectiviteId,
        demarcheId: demarche.id,
        domaineId: ajout.id,
      })
    ).rejects.toThrow();
  });
});
