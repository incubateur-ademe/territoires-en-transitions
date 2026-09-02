import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PcaetDemandeAvisEtatEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { inArray } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('listDemandesAvis', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let marieEmail: string;
  let agentNational: AuthenticatedUser;
  let drealId: number;
  let serviceNationalId: number;
  const demarcheIds: number[] = [];

  const REGION = '44';
  const AUTRE_REGION = '75';

  const dansNJours = (n: number) =>
    new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();

  const appeler = (user: AuthenticatedUser, input: Record<string, unknown>) =>
    router.createCaller({ user }).demarches.pcaet.listDemandesAvis({
      collectiviteId: drealId,
      ...input,
    });

  const creerDossier = async ({
    collectiviteId,
    status,
    avisDeadlineAt,
    avis,
  }: {
    collectiviteId: number;
    status: 'transmis_pour_avis' | 'publie';
    avisDeadlineAt: string;
    avis?: { valide: boolean };
  }) => {
    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: 'pcaet',
        titre: 'PCAET test liste',
        status,
        transmittedAt: dansNJours(-30),
        avisDeadlineAt,
      })
      .returning({ id: demarcheTable.id });
    demarcheIds.push(demarche.id);

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId: drealId,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });

    if (avis) {
      await db.db.insert(pcaetAvisTable).values({
        demandeAvisId: demande.id,
        emetteurCollectiviteId: drealId,
        auTitreDe: 'prefet_region',
        sens: 'favorable',
        fichierRef: avis.valide ? 'avis/test.pdf' : null,
        valideLe: avis.valide ? new Date().toISOString() : null,
      });
    }

    return { demarcheId: demarche.id, demandeId: demande.id };
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test liste demandes',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);
    drealId = dreal.collectivite.id;

    const aTraiter = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN, prenom: 'Zoe', nom: 'Martin' },
      collectivite: {
        regionCode: REGION,
        departementCode: '54',
        nom: 'Zitrone Agglo',
      },
    });
    marie = getAuthUserFromUserCredentials(aTraiter.user);
    marieEmail = aTraiter.user.email;

    const avisRendu = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN, prenom: 'Alice', nom: 'Bernard' },
      collectivite: {
        regionCode: REGION,
        departementCode: '67',
        nom: 'Abricot Communaute',
      },
    });

    const horsPerimetre = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: AUTRE_REGION, nom: 'Melon Metropole' },
    });

    await creerDossier({
      collectiviteId: aTraiter.collectivite.id,
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansNJours(60),
    });
    await creerDossier({
      collectiviteId: avisRendu.collectivite.id,
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansNJours(10),
      avis: { valide: true },
    });
    const dossierHorsPerimetre = await creerDossier({
      collectiviteId: horsPerimetre.collectivite.id,
      status: 'transmis_pour_avis',
      avisDeadlineAt: dansNJours(20),
    });

    // Le périmètre national, sur le seul dossier hors de la DREAL de la spec.
    const serviceNational = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'service_national',
        nom: 'Service national test liste demandes',
      },
    });
    serviceNationalId = serviceNational.collectivite.id;
    agentNational = getAuthUserFromUserCredentials(serviceNational.user);

    await db.db.insert(pcaetDemandeAvisTable).values({
      demarcheId: dossierHorsPerimetre.demarcheId,
      instructeurCollectiviteId: serviceNationalId,
      source: 'seed',
    });

    return async () => {
      await serviceNational.cleanup();
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(inArray(pcaetDemandeAvisTable.demarcheId, demarcheIds));
      await db.db
        .delete(demarcheTable)
        .where(inArray(demarcheTable.id, demarcheIds));
      await horsPerimetre.cleanup();
      await avisRendu.cleanup();
      await aTraiter.cleanup();
      await dreal.cleanup();
      await app.close();
    };
  });

  it('ne liste que les dossiers couverts par le périmètre de la DREAL', async () => {
    const result = await appeler(camille, {});

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.collectivite.nom)).not.toContain(
      'Melon Metropole'
    );
  });

  it('trie par échéance décroissante par défaut', async () => {
    const result = await appeler(camille, {});

    // L'échéance vaut la transmission plus le délai légal : la décroissante met
    // donc les dossiers transmis le plus récemment en tête.
    expect(result.items.map((item) => item.collectivite.nom)).toEqual([
      'Zitrone Agglo',
      'Abricot Communaute',
    ]);
  });

  it("trie par statut dans l'ordre du cycle d'instruction", async () => {
    const asc = await appeler(camille, { sort: 'statut', direction: 'asc' });
    const desc = await appeler(camille, { sort: 'statut', direction: 'desc' });

    expect(asc.items.map((item) => item.etat)).toEqual([
      PcaetDemandeAvisEtatEnum.A_TRAITER,
      PcaetDemandeAvisEtatEnum.AVIS_RENDU,
    ]);
    expect(desc.items.map((item) => item.etat)).toEqual([
      PcaetDemandeAvisEtatEnum.AVIS_RENDU,
      PcaetDemandeAvisEtatEnum.A_TRAITER,
    ]);
  });

  it('trie par contact', async () => {
    const asc = await appeler(camille, { sort: 'contact', direction: 'asc' });
    const desc = await appeler(camille, { sort: 'contact', direction: 'desc' });

    expect(asc.items.map((item) => item.contacts[0]?.prenom)).toEqual([
      'Alice',
      'Zoe',
    ]);
    expect(desc.items.map((item) => item.contacts[0]?.prenom)).toEqual([
      'Zoe',
      'Alice',
    ]);
  });

  it('déduit les états et les compte', async () => {
    const result = await appeler(camille, {});

    const parNom = new Map(
      result.items.map((item) => [item.collectivite.nom, item.etat])
    );
    expect(parNom.get('Zitrone Agglo')).toBe(
      PcaetDemandeAvisEtatEnum.A_TRAITER
    );
    expect(parNom.get('Abricot Communaute')).toBe(
      PcaetDemandeAvisEtatEnum.AVIS_RENDU
    );
    expect(result.countByEtat.a_traiter).toBe(1);
    expect(result.countByEtat.avis_rendu).toBe(1);
    expect(result.countByEtat.clos).toBe(0);
  });

  it('agrège les statistiques du tableau de bord sur tout le périmètre', async () => {
    const result = await appeler(camille, {});
    const premierePage = await appeler(camille, { limit: 1, page: 1 });

    // Un seul dossier a abouti — transmis il y a 30 jours, avis validé à
    // l'instant — et c'est le seul à peser sur la moyenne : celui qui est encore
    // à instruire n'a pas de durée.
    expect(result.stats.delaiMoyenJours).toBe(30);
    expect(premierePage.items).toHaveLength(1);
    expect(premierePage.stats).toEqual(result.stats);
  });

  it('filtre par état', async () => {
    const result = await appeler(camille, {
      etats: [PcaetDemandeAvisEtatEnum.A_TRAITER],
    });

    expect(result.total).toBe(1);
    expect(result.items[0].collectivite.nom).toBe('Zitrone Agglo');
  });

  it('filtre par département', async () => {
    const result = await appeler(camille, { departementCodes: ['67'] });

    expect(result.total).toBe(1);
    expect(result.items[0].collectivite.nom).toBe('Abricot Communaute');
  });

  it('recherche par nom de collectivité, insensible à la casse', async () => {
    const result = await appeler(camille, { recherche: 'zitrone' });

    expect(result.total).toBe(1);
    expect(result.items[0].collectivite.nom).toBe('Zitrone Agglo');
  });

  it('pagine sans perdre le total', async () => {
    const result = await appeler(camille, { limit: 1, page: 2 });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
    // Second du tri par défaut, donc l'échéance la plus proche.
    expect(result.items[0].collectivite.nom).toBe('Abricot Communaute');
  });

  it('expose le référent de la collectivité comme contact', async () => {
    const result = await appeler(camille, { recherche: 'zitrone' });

    expect(result.items[0].contacts.map((c) => c.email)).toContain(marieEmail);
  });

  it("refuse l'agente d'une collectivité déposante", async () => {
    await expect(appeler(marie, {})).rejects.toThrow();
  });

  it('un service national voit un dossier hors de tout périmètre régional', async () => {
    const result = await router
      .createCaller({ user: agentNational })
      .demarches.pcaet.listDemandesAvis({
        collectiviteId: serviceNationalId,
        recherche: 'melon',
      });

    expect(result.items.map((item) => item.collectivite.nom)).toContain(
      'Melon Metropole'
    );
  });
});
